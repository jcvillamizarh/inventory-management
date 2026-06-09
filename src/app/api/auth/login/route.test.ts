import { describe, it, expect, beforeEach, vi } from 'vitest';

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
});
