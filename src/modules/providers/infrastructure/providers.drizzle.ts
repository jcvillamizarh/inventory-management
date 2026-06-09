import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db/index.js';
import { providers } from '../../../lib/db/schema.js';
import type { IProviderRepository, Provider } from '../providers.repository.js';

export class DrizzleProviderRepository implements IProviderRepository {
  async findByNitCedula(nitCedula: string): Promise<Provider | null> {
    const result = await db
      .select()
      .from(providers)
      .where(eq(providers.nitCedula, nitCedula))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const provider = result[0];
    return {
      id: provider.id,
      nitCedula: provider.nitCedula,
      name: provider.name,
      phone: provider.phone,
      address: provider.address,
      createdAt: provider.createdAt,
    };
  }

  async save(provider: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider> {
    const result = await db
      .insert(providers)
      .values({
        nitCedula: provider.nitCedula,
        name: provider.name,
        phone: provider.phone,
        address: provider.address,
      })
      .returning();

    const savedProvider = result[0];
    return {
      id: savedProvider.id,
      nitCedula: savedProvider.nitCedula,
      name: savedProvider.name,
      phone: savedProvider.phone,
      address: savedProvider.address,
      createdAt: savedProvider.createdAt,
    };
  }
}
