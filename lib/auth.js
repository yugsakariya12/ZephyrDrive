import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-fallback-secret-key');

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable.');
}

/**
 * Hash a plain text password using bcrypt.
 * Uses a salt round of 10 for a good balance of security and speed.
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare a plain text password with a hashed password.
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token with the user's ID, email, and role.
 * Expires in 24 hours.
 */
export function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify a JWT token and return its payload.
 * Throws an error if invalid or expired.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Helper to verify JWT from incoming Next.js requests.
 * Checks both the httpOnly 'token' cookie and the 'Authorization' header.
 * 
 * Returns the decoded token payload on success, or null on failure.
 */
export function verifyAuth(request) {
  try {
    // 1. Try to read token from cookies (checking if request.cookies is defined)
    const cookieToken = request.cookies?.get ? request.cookies.get('token')?.value : null;
    if (cookieToken) {
      return verifyToken(cookieToken);
    }

    // 2. Try to read token from Authorization header (e.g. Bearer <token>)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const headerToken = authHeader.substring(7);
      return verifyToken(headerToken);
    }

    return null;
  } catch (error) {
    // Return null if token has expired or is invalid
    return null;
  }
}
