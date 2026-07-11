import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import { verifyAuth } from '@/lib/auth';

// GET /api/vehicles - List all available vehicles (protected)
export async function GET(request) {
  try {
    await connectDB();

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Retrieve vehicles
    const query = user.role === 'admin' ? { createdBy: user.userId } : {};
    const vehicles = await Vehicle.find(query);
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('GET Vehicles Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/vehicles - Add a new vehicle (protected, admin-only check in line with admin UI requirements)
export async function POST(request) {
  try {
    await connectDB();

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Check if the user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const { make, model, category, price, quantity, imageUrl } = await request.json();

    // Validate request body
    if (!make || !model || !category || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'make, model, category, price, and quantity are required.' },
        { status: 400 }
      );
    }

    if (price < 0 || quantity < 0) {
      return NextResponse.json(
        { error: 'Price and quantity must be non-negative numbers.' },
        { status: 400 }
      );
    }

    const newVehicle = await Vehicle.create({
      make,
      model,
      category,
      price,
      quantity,
      imageUrl: imageUrl || '',
      createdBy: user.userId,
      createdByEmail: user.email,
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('POST Vehicle Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
