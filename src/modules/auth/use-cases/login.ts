import bcrypt from 'bcryptjs';
import type { IAuthRepository } from '../auth.repository.js';

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(username: string, password: string) {
    // Find user by username
    const user = await this.authRepository.findByUsername(username);
    if (!user) {
      return {
        statusCode: 401,
        message: 'Invalid credentials',
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        statusCode: 401,
        message: 'User account is inactive',
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        message: 'Invalid credentials',
      };
    }

    return {
      statusCode: 200,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
