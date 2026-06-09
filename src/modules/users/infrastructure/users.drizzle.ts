import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db/index.js';
import { users } from '../../../lib/db/schema.js';
import type { IUserRepository, User } from '../users.repository.js';

export class DrizzleUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role as 'ADMINISTRADOR' | 'OPERADOR' | 'CONSULTA',
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async save(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: user.isActive,
      })
      .returning();

    const savedUser = result[0];
    return {
      id: savedUser.id,
      username: savedUser.username,
      passwordHash: savedUser.passwordHash,
      role: savedUser.role as 'ADMINISTRADOR' | 'OPERADOR' | 'CONSULTA',
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
    };
  }
}
