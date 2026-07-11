import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, comparePassword, signToken, verifyToken, verifyAuth } from '@/lib/auth';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import User from '@/models/User';

// Mock DB connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(null)
}));

// Mock User Model
vi.mock('@/models/User', () => {
  return {
    default: {
      findOne: vi.fn(),
      create: vi.fn(),
    }
  };
});

describe('Authentication Logic & Helpers', () => {
  it('should correctly hash and compare passwords', async () => {
    const plainText = 'securePassword123';
    const hashed = await hashPassword(plainText);
    
    expect(hashed).not.toBe(plainText);
    
    const isMatch = await comparePassword(plainText, hashed);
    expect(isMatch).toBe(true);

    const isFail = await comparePassword('wrongPassword', hashed);
    expect(isFail).toBe(false);
  });

  it('should sign and verify JWT tokens containing claims', () => {
    const mockUser = {
      _id: 'user_123',
      email: 'user@example.com',
      role: 'admin',
    };

    const token = signToken(mockUser);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(mockUser._id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
  });
});

describe('Registration API Endpoint (POST /api/auth/register)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if validation fails (e.g. missing password)', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Email and password are required');
  });

  it('should return 400 if password is too short', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: '123' }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Password must be at least 6 characters');
  });

  it('should return 400 if email is already registered', async () => {
    User.findOne.mockResolvedValue({ email: 'existing@example.com' });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@example.com', password: 'password123' }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Email is already registered');
  });

  it('should create user and hash password on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'user_created',
      email: 'new@example.com',
      role: 'user',
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', password: 'secure_password' }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    
    // Verify password was hashed before creating
    expect(User.create).toHaveBeenCalled();
    const mockCalls = User.create.mock.calls[0][0];
    expect(mockCalls.password).not.toBe('secure_password'); // hashed
    expect(mockCalls.email).toBe('new@example.com');
  });
});

describe('Login API Endpoint (POST /api/auth/login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail with 401 for non-existent users', async () => {
    User.findOne.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'fake@example.com', password: 'password' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Invalid email or password');
  });

  it('should fail with 401 for incorrect password match', async () => {
    const wrongHash = await hashPassword('correct_pass');
    User.findOne.mockResolvedValue({
      email: 'test@example.com',
      password: wrongHash,
    });

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'incorrect_pass' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('should set JWT cookie and return token on successful login', async () => {
    const secretHash = await hashPassword('supersecret');
    User.findOne.mockResolvedValue({
      _id: 'user_success',
      email: 'user@example.com',
      password: secretHash,
      role: 'user',
    });

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'supersecret' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.token).toBeDefined();
    
    // Cookie check
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('token=');
    expect(setCookieHeader).toContain('HttpOnly');
  });
});
