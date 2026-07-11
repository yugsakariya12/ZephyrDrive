import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken } from '@/lib/auth';
import { GET as getVehicles, POST as createVehicle } from '@/app/api/vehicles/route';
import { GET as searchVehicles } from '@/app/api/vehicles/search/route';
import { PUT as updateVehicle, DELETE as deleteVehicle } from '@/app/api/vehicles/[id]/route';
import Vehicle from '@/models/Vehicle';

// Mock DB Connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(null)
}));

// Mock Vehicle Model
vi.mock('@/models/Vehicle', () => {
  return {
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndDelete: vi.fn(),
      create: vi.fn(),
    }
  };
});

describe('Vehicle CRUD API Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Generate valid tokens for verification helper
    adminToken = signToken({ _id: 'admin_id', email: 'admin@test.com', role: 'admin' });
    userToken = signToken({ _id: 'user_id', email: 'user@test.com', role: 'user' });
  });

  describe('GET /api/vehicles', () => {
    it('should return 401 if request is unauthenticated', async () => {
      const req = new Request('http://localhost/api/vehicles', { method: 'GET' });
      const res = await getVehicles(req);
      expect(res.status).toBe(401);
    });

    it('should retrieve list of vehicles if authenticated', async () => {
      const mockList = [{ make: 'Porsche', model: 'Cayman' }];
      Vehicle.find.mockResolvedValue(mockList);

      const req = new Request('http://localhost/api/vehicles', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      const res = await getVehicles(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockList);
    });
  });

  describe('POST /api/vehicles', () => {
    it('should return 403 Forbidden if normal user attempts creation', async () => {
      const req = new Request('http://localhost/api/vehicles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ make: 'BMW', model: 'M3' }),
      });

      const res = await createVehicle(req);
      expect(res.status).toBe(403);
    });

    it('should create vehicle if admin role is provided', async () => {
      const mockVehicle = { make: 'Tesla', model: 'Model S', category: 'Sedan', price: 80000, quantity: 3 };
      Vehicle.create.mockResolvedValue(mockVehicle);

      const req = new Request('http://localhost/api/vehicles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(mockVehicle),
      });

      const res = await createVehicle(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.make).toBe('Tesla');
    });
  });

  describe('GET /api/vehicles/search', () => {
    it('should build regex query and call search endpoint', async () => {
      Vehicle.find.mockResolvedValue([]);
      
      const req = new Request('http://localhost/api/vehicles/search?make=Audi&minPrice=10000', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      const res = await searchVehicles(req);
      expect(res.status).toBe(200);
      
      // Verify query formation
      expect(Vehicle.find).toHaveBeenCalled();
      const queryParamMock = Vehicle.find.mock.calls[0][0];
      expect(queryParamMock.make.$regex).toBe('Audi');
      expect(queryParamMock.price.$gte).toBe(10000);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('should reject changes from non-admins', async () => {
      const req = new Request('http://localhost/api/vehicles/123', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ price: 120000 }),
      });

      const res = await updateVehicle(req, { params: { id: '123' } });
      expect(res.status).toBe(403);
    });

    it('should apply updates on Mongoose save if admin', async () => {
      const mockVehicle = {
        _id: '123',
        make: 'Ferrari',
        price: 250000,
        save: vi.fn().mockResolvedValue(true),
      };
      Vehicle.findById.mockResolvedValue(mockVehicle);

      const req = new Request('http://localhost/api/vehicles/123', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ price: 260000 }),
      });

      const res = await updateVehicle(req, { params: { id: '123' } });
      expect(res.status).toBe(200);
      expect(mockVehicle.price).toBe(260000);
      expect(mockVehicle.save).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should restrict deletions to admins', async () => {
      const req = new Request('http://localhost/api/vehicles/123', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      const res = await deleteVehicle(req, { params: { id: '123' } });
      expect(res.status).toBe(403);
    });

    it('should delete from DB if admin', async () => {
      Vehicle.findById.mockResolvedValue({ _id: '123' });
      Vehicle.findByIdAndDelete.mockResolvedValue({});

      const req = new Request('http://localhost/api/vehicles/123', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const res = await deleteVehicle(req, { params: { id: '123' } });
      expect(res.status).toBe(200);
      expect(Vehicle.findByIdAndDelete).toHaveBeenCalledWith('123');
    });
  });
});
