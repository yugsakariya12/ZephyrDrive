import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import { verifyAuth } from '@/lib/auth';

// GET /api/vehicles/search - filter by make, model, category, or price range (query params)
export async function GET(request) {
  try {
    await connectDB();

    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Build the query dynamic filters
    const query = {};

    if (user.role === 'admin') {
      query.createdBy = user.userId;
    }

    if (make) {
      query.make = { $regex: make, $options: 'i' }; // case-insensitive regex
    }
    if (model) {
      query.model = { $regex: model, $options: 'i' };
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    const vehicles = await Vehicle.find(query);
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
