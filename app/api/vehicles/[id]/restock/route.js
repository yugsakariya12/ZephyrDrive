import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import { verifyAuth } from '@/lib/auth';

// POST /api/vehicles/:id/restock - Increment quantity (admin only)
export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Restrict access: Only admins can restock
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { quantity } = body;

    // Validate restock quantity input
    if (quantity === undefined || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'A positive integer quantity is required for restocking.' },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
    }

    // Verify vehicle ownership (multi-admin isolation)
    if (vehicle.createdBy && vehicle.createdBy !== user.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this vehicle resource.' }, { status: 403 });
    }

    // Increment quantity
    vehicle.quantity += quantity;
    await vehicle.save();

    return NextResponse.json({
      message: 'Restock successful.',
      vehicle,
    });
  } catch (error) {
    console.error('Restock API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
