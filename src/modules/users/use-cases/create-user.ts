import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '../users.repository.js';

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['ADMINISTRADOR', 'OPERADOR', 'CONSULTA']),
});

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: unknown) {
    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = createUserSchema.parse(input);
    } catch (error) {
      throw {
        statusCode: 400,
        message: 'Invalid input data',
      };
    }

    // Check if username already exists
    const existingUser = await this.userRepository.findByUsername(validatedInput.username);
    if (existingUser) {
      throw {
        statusCode: 409,
        message: 'Username already exists',
      };
    }

    // Hash password with bcrypt (cost factor 10 as per OWASP)
    const passwordHash = await bcrypt.hash(validatedInput.password, 10);

    // Save user to repository
    const user = await this.userRepository.save({
      username: validatedInput.username,
      passwordHash,
      role: validatedInput.role,
      isActive: true,
    });

    return {
      statusCode: 201,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }
}
