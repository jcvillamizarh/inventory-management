import { describe, it, expect } from 'vitest';
import { CreateUserUseCase } from './create-user.js';
import type { IUserRepository, User } from '../users.repository.js';

class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async save(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
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

describe('CreateUserUseCase', () => {
  it('should fail with 409 if username already exists', async () => {
    const mockRepo = new MockUserRepository();
    const useCase = new CreateUserUseCase(mockRepo);

    // First user created successfully
    await useCase.execute({
      username: 'john_doe',
      password: 'password123',
      role: 'OPERADOR',
    });

    // Attempt to create duplicate username
    await expect(
      useCase.execute({
        username: 'john_doe',
        password: 'different_password',
        role: 'ADMINISTRADOR',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Username already exists',
    });
  });

  it('should fail with 400 if input data does not match Zod schema', async () => {
    const mockRepo = new MockUserRepository();
    const useCase = new CreateUserUseCase(mockRepo);

    // Invalid role
    await expect(
      useCase.execute({
        username: 'jane_doe',
        password: 'password123',
        role: 'INVALID_ROLE' as any,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Empty username
    await expect(
      useCase.execute({
        username: '',
        password: 'password123',
        role: 'OPERADOR',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Empty password
    await expect(
      useCase.execute({
        username: 'jane_doe',
        password: '',
        role: 'OPERADOR',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should succeed with 201 if data is valid and password must be hashed', async () => {
    const mockRepo = new MockUserRepository();
    const useCase = new CreateUserUseCase(mockRepo);

    const plainPassword = 'my_secure_password_123';
    const result = await useCase.execute({
      username: 'alice',
      password: plainPassword,
      role: 'ADMINISTRADOR',
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        username: 'alice',
        role: 'ADMINISTRADOR',
        isActive: true,
      },
    });

    // Verify password is NOT stored in plain text
    const savedUser = await mockRepo.findByUsername('alice');
    expect(savedUser).not.toBeNull();
    expect(savedUser!.passwordHash).not.toBe(plainPassword);
    expect(savedUser!.passwordHash).toHaveLength(60); // bcrypt hash length
  });
});
