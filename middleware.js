import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Let Next.js internal static assets and favicon pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/screenshots') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isApiRoute = pathname.startsWith('/api');

  // If the user is not authenticated:
  if (!token) {
    // Redirect to login if they try to access any protected page (non-auth page and not an API route)
    if (!isAuthPage && !isApiRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    // If they are authenticated, prevent them from going to login/register pages
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
