import { describe, it, expect } from 'vitest';
import { CreateProviderUseCase } from './create-provider.js';
import type { IProviderRepository, Provider } from '../providers.repository.js';

class MockProviderRepository implements IProviderRepository {
  private providers: Provider[] = [];

  async findByNitCedula(nitCedula: string): Promise<Provider | null> {
    return this.providers.find(p => p.nitCedula === nitCedula) || null;
  }

  async save(provider: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider> {
    const newProvider: Provider = {
      id: this.providers.length + 1,
      createdAt: new Date(),
      ...provider,
    };
    this.providers.push(newProvider);
    return newProvider;
  }

  clear() {
    this.providers = [];
  }
}

describe('CreateProviderUseCase', () => {
  it('should fail with 409 if NIT/Cedula already exists', async () => {
    const mockRepo = new MockProviderRepository();
    const useCase = new CreateProviderUseCase(mockRepo);

    // First provider created successfully
    await useCase.execute({
      nitCedula: '900.123.456-1',
      name: 'Distribuidora El Triunfo',
      phone: '555-1234',
    });

    // Attempt to create duplicate NIT
    await expect(
      useCase.execute({
        nitCedula: '900.123.456-1',
        name: 'Otra Distribuidora',
        phone: '555-5678',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'NIT/Cedula already exists',
    });
  });

  it('should fail with 400 if input data does not match Zod schema', async () => {
    const mockRepo = new MockProviderRepository();
    const useCase = new CreateProviderUseCase(mockRepo);

    // Empty name
    await expect(
      useCase.execute({
        nitCedula: '900.123.456-1',
        name: '',
        phone: '555-1234',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should succeed with 201 if data is valid', async () => {
    const mockRepo = new MockProviderRepository();
    const useCase = new CreateProviderUseCase(mockRepo);

    const result = await useCase.execute({
      nitCedula: '900.123.456-1',
      name: 'Distribuidora El Triunfo',
      phone: '555-1234',
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        nitCedula: '900.123.456-1',
        name: 'Distribuidora El Triunfo',
        phone: '555-1234',
      },
    });
  });

  it('should succeed with 201 when only name is provided (informal provider)', async () => {
    const mockRepo = new MockProviderRepository();
    const useCase = new CreateProviderUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Verdulería Don Juan',
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        nitCedula: null,
        name: 'Verdulería Don Juan',
        phone: null,
        address: null,
      },
    });
  });

  it('should succeed with 201 when name and optional fields are provided', async () => {
    const mockRepo = new MockProviderRepository();
    const useCase = new CreateProviderUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Frutería La Fresca',
      phone: '555-9999',
      address: 'Calle 123 #45-67',
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        nitCedula: null,
        name: 'Frutería La Fresca',
        phone: '555-9999',
        address: 'Calle 123 #45-67',
      },
    });
  });
});
