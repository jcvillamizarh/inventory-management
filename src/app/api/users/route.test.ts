import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the DrizzleUserRepository
class MockDrizzleUserRepository {
  private users: any[] = [];

  async findByUsername(username: string) {
    return this.users.find(u => u.username === username) || null;
  }

  async save(user: any) {
    const newUser = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }

  clear() {
    this.users = [];
  }
}

const mockRepo = new MockDrizzleUserRepository();

// Mock the repository import
vi.mock('../../../modules/users/infrastructure/users.drizzle.js', () => ({
  DrizzleUserRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

// Import after mock
import { POST } from './route.js';

describe('POST /api/users', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 201 and created user when data is valid', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'john_doe',
        password: 'password123',
        role: 'OPERADOR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: expect.any(String),
      username: 'john_doe',
      role: 'OPERADOR',
      isActive: true,
      createdAt: expect.any(String),
    });
    expect(data).not.toHaveProperty('passwordHash');
  });

  it('should return 400 when input data is invalid', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '',
        password: 'password123',
        role: 'OPERADOR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });

  it('should return 409 when username already exists', async () => {
    // Create first user
    await mockRepo.save({
      username: 'john_doe',
      passwordHash: 'hashed_password',
      role: 'OPERADOR',
      isActive: true,
    });

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'john_doe',
        password: 'different_password',
        role: 'ADMINISTRADOR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toMatchObject({
      error: 'Username already exists',
    });
  });
});
