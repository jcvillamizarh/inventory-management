import { describe, it, expect } from 'vitest';
import { LoginUseCase } from './login.js';
import type { IAuthRepository } from '../auth.repository.js';

class MockAuthRepository implements IAuthRepository {
  private users: any[] = [];

  async findByUsername(username: string) {
    return this.users.find((u) => u.username === username) || null;
  }

  addUser(user: any) {
    this.users.push(user);
  }

  clear() {
    this.users = [];
  }
}

describe('LoginUseCase', () => {
  it('should return user data when credentials are correct', async () => {
    const mockRepo = new MockAuthRepository();
    mockRepo.addUser({
      id: '123',
      username: 'admin',
      passwordHash: '$2a$10$hashedpassword',
      role: 'ADMINISTRADOR',
      isActive: true,
      createdAt: new Date(),
    });

    const useCase = new LoginUseCase(mockRepo);
    const result = await useCase.execute('admin', 'password123');

    expect(result).toMatchObject({
      statusCode: 200,
      data: {
        id: '123',
        username: 'admin',
        role: 'ADMINISTRADOR',
      },
    });
  });

  it('should return 401 when user not found', async () => {
    const mockRepo = new MockAuthRepository();
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute('nonexistent', 'password');

    expect(result).toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('should return 401 when password is incorrect', async () => {
    const mockRepo = new MockAuthRepository();
    mockRepo.addUser({
      id: '123',
      username: 'admin',
      passwordHash: '$2a$10$wronghash',
      role: 'ADMINISTRADOR',
      isActive: true,
      createdAt: new Date(),
    });

    const useCase = new LoginUseCase(mockRepo);
    const result = await useCase.execute('admin', 'wrongpassword');

    expect(result).toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });
});
