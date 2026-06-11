import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn().mockImplementation((password: string, hash: string) => {
      // For testing purposes, accept any password when hash starts with '$2a$10$hashedpassword'
      if (hash === '$2a$10$hashedpassword') {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }),
  },
}));

// Mock the DrizzleAuthRepository
class MockDrizzleAuthRepository {
  private user: any = null;

  async findByUsername(username: string) {
    return this.user;
  }

  setUser(user: any) {
    this.user = user;
  }

  clear() {
    this.user = null;
  }
}

const mockRepo = new MockDrizzleAuthRepository();

// Mock the repository import
vi.mock('../../../../modules/auth/infrastructure/auth.drizzle.js', () => ({
  DrizzleAuthRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

// Import after mock
import { POST } from './route.js';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 200 and user data on successful login', async () => {
    mockRepo.setUser({
      id: '123',
      username: 'admin',
      passwordHash: '$2a$10$hashedpassword',
      role: 'ADMINISTRADOR',
      isActive: true,
      createdAt: new Date(),
    });

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: '123',
      username: 'admin',
      role: 'ADMINISTRADOR',
    });
  });

  it('should return 401 when credentials are invalid', async () => {
    mockRepo.setUser(null);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      error: 'Invalid credentials',
    });
  });

  describe('Session Cookie Security', () => {
    it('should set session-only cookie (no maxAge or expires)', async () => {
      mockRepo.setUser({
        id: '123',
        username: 'admin',
        passwordHash: '$2a$10$hashedpassword',
        role: 'ADMINISTRADOR',
        isActive: true,
        createdAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password' }),
      });

      const response = await POST(request);

      // Check that Set-Cookie header is present
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();

      // Check that cookie does NOT have maxAge
      expect(setCookieHeader).not.toContain('Max-Age');

      // Check that cookie does NOT have Expires
      expect(setCookieHeader).not.toContain('Expires');

      // Check security attributes
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Lax');
    });

    it('should NOT set Secure flag in development', async () => {
      mockRepo.setUser({
        id: '123',
        username: 'admin',
        passwordHash: '$2a$10$hashedpassword',
        role: 'ADMINISTRADOR',
        isActive: true,
        createdAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password' }),
      });

      const response = await POST(request);
      const setCookieHeader = response.headers.get('Set-Cookie');

      // In development, Secure flag should NOT be set
      expect(setCookieHeader).not.toContain('Secure');
    });
  });
});
