import { db } from '../../../lib/db/index.js';
import { users } from '../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import type { IAuthRepository, User } from '../auth.repository.js';

export class DrizzleAuthRepository implements IAuthRepository {
  async findByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      username: result[0].username,
      passwordHash: result[0].passwordHash,
      role: result[0].role,
      isActive: result[0].isActive,
      createdAt: result[0].createdAt,
    };
  }
}
