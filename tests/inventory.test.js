import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken } from '@/lib/auth';
import { POST as purchaseVehicle } from '@/app/api/vehicles/[id]/purchase/route';
import { POST as restockVehicle } from '@/app/api/vehicles/[id]/restock/route';
import Vehicle from '@/models/Vehicle';

// Mock DB Connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(null)
}));

// Mock Vehicle Model
vi.mock('@/models/Vehicle', () => {
  return {
    default: {
      findById: vi.fn(),
    }
  };
});

describe('Inventory Control (Purchase & Restock) APIs', () => {
  let adminToken;
  let userToken;

  beforeEach(() => {
    vi.clearAllMocks();
    
    adminToken = signToken({ _id: 'admin_id', email: 'admin@test.com', role: 'admin' });
    userToken = signToken({ _id: 'user_id', email: 'user@test.com', role: 'user' });
  });

  describe('Purchase Vehicle (POST /api/vehicles/:id/purchase)', () => {
    it('should decrement stock levels by 1 on success', async () => {
      const mockVehicle = {
        _id: 'veh_purchase',
        make: 'Porsche',
        model: 'Taycan',
        quantity: 5,
        save: vi.fn().mockResolvedValue(true),
      };
      Vehicle.findById.mockResolvedValue(mockVehicle);

      const req = new Request('http://localhost/api/vehicles/veh_purchase/purchase', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      const res = await purchaseVehicle(req, { params: { id: 'veh_purchase' } });
      expect(res.status).toBe(200);
      expect(mockVehicle.quantity).toBe(4);
      expect(mockVehicle.save).toHaveBeenCalled();
    });

    it('should reject purchase with 400 when quantity is 0 (out of stock)', async () => {
      const mockVehicle = {
        _id: 'veh_empty',
        make: 'Ford',
        model: 'Mustang Mach-E',
        quantity: 0,
        save: vi.fn(),
      };
      Vehicle.findById.mockResolvedValue(mockVehicle);

      const req = new Request('http://localhost/api/vehicles/veh_empty/purchase', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      const res = await purchaseVehicle(req, { params: { id: 'veh_empty' } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('out of stock');
      expect(mockVehicle.save).not.toHaveBeenCalled();
    });
  });

  describe('Restock Vehicle (POST /api/vehicles/:id/restock)', () => {
    it('should reject restocking operations for non-admins', async () => {
      const req = new Request('http://localhost/api/vehicles/veh_restock/restock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ quantity: 10 })
      });

      const res = await restockVehicle(req, { params: { id: 'veh_restock' } });
      expect(res.status).toBe(403);
    });

    it('should increment vehicle quantity for admin roles', async () => {
      const mockVehicle = {
        _id: 'veh_restock',
        make: 'Lexus',
        model: 'LC500',
        quantity: 2,
        save: vi.fn().mockResolvedValue(true),
      };
      Vehicle.findById.mockResolvedValue(mockVehicle);

      const req = new Request('http://localhost/api/vehicles/veh_restock/restock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ quantity: 8 })
      });

      const res = await restockVehicle(req, { params: { id: 'veh_restock' } });
      expect(res.status).toBe(200);
      expect(mockVehicle.quantity).toBe(10);
      expect(mockVehicle.save).toHaveBeenCalled();
    });

    it('should return 400 for negative, invalid, or float restock requests', async () => {
      const req = new Request('http://localhost/api/vehicles/veh_restock/restock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ quantity: 3.5 }) // invalid float
      });

      const res = await restockVehicle(req, { params: { id: 'veh_restock' } });
      expect(res.status).toBe(400);
    });
  });
});
