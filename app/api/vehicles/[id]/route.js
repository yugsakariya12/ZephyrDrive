import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import { verifyAuth } from '@/lib/auth';

// PUT /api/vehicles/:id - Update vehicle details (admin-only)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { make, model, category, price, quantity, imageUrl } = body;

    // Retrieve and check if vehicle exists
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
    }

    // Verify vehicle ownership (multi-admin isolation)
    if (vehicle.createdBy && vehicle.createdBy !== user.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this vehicle resource.' }, { status: 403 });
    }

    // Apply updates if values are provided in request
    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (category !== undefined) vehicle.category = category;
    if (imageUrl !== undefined) vehicle.imageUrl = imageUrl;
    if (price !== undefined) {
      if (price < 0) {
        return NextResponse.json({ error: 'Price must be non-negative.' }, { status: 400 });
      }
      vehicle.price = price;
    }
    if (quantity !== undefined) {
      if (quantity < 0) {
        return NextResponse.json({ error: 'Quantity must be non-negative.' }, { status: 400 });
      }
      vehicle.quantity = quantity;
    }

    await vehicle.save();
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('PUT Vehicle Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/vehicles/:id - Delete vehicle (admin only - check role from JWT payload)
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    // Retrieve and check if vehicle exists
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
    }

    // Verify vehicle ownership (multi-admin isolation)
    if (vehicle.createdBy && vehicle.createdBy !== user.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this vehicle resource.' }, { status: 403 });
    }

    await Vehicle.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Vehicle deleted successfully.' });
  } catch (error) {
    console.error('DELETE Vehicle Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
