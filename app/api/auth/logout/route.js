import { NextResponse } from 'next/server';

// POST /api/auth/logout - Revoke session token cookie
export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the secure HttpOnly token cookie by setting expires date in the past
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Logout Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
