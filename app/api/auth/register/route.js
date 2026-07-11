import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password, role } = await request.json();

    // Client-side and backend validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered.' },
        { status: 400 }
      );
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(password);

    // Default to 'user' role unless a valid 'admin' request is specifically made
    const userRole = role === 'admin' ? 'admin' : 'user';

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: userRole,
    });

    return NextResponse.json(
      {
        message: 'Registration successful.',
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration.' },
      { status: 500 }
    );
  }
}
