import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import { verifyAuth } from '@/lib/auth';

// POST /api/vehicles/:id/purchase - Decrement quantity by 1 (reject if quantity is 0)
export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
    }

    // Purchase business logic validation: cannot purchase if stock is empty
    if (vehicle.quantity <= 0) {
      return NextResponse.json(
        { error: 'Vehicle is out of stock and cannot be purchased.' },
        { status: 400 }
      );
    }

    // Decrement the stock quantity by 1
    vehicle.quantity -= 1;
    await vehicle.save();

    return NextResponse.json({
      message: 'Purchase successful.',
      vehicle,
    });
  } catch (error) {
    console.error('Purchase API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
