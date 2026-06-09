import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the DrizzleProviderRepository
class MockDrizzleProviderRepository {
  private providers: any[] = [];

  async findByNitCedula(nitCedula: string) {
    return this.providers.find(p => p.nitCedula === nitCedula) || null;
  }

  async save(provider: any) {
    const newProvider = {
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

const mockRepo = new MockDrizzleProviderRepository();

// Mock the repository import
vi.mock('../../../modules/providers/infrastructure/providers.drizzle.js', () => ({
  DrizzleProviderRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

// Import after mock
import { POST } from './route.js';

describe('POST /api/providers', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 201 and created provider when data is valid', async () => {
    const request = new Request('http://localhost/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nitCedula: '900.123.456-1',
        name: 'Distribuidora El Triunfo',
        phone: '555-1234',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: expect.any(Number),
      nitCedula: '900.123.456-1',
      name: 'Distribuidora El Triunfo',
      phone: '555-1234',
      createdAt: expect.any(String),
    });
  });

  it('should return 400 when input data is invalid (empty name)', async () => {
    const request = new Request('http://localhost/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nitCedula: '900.123.456-1',
        name: '',
        phone: '555-1234',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });

  it('should return 201 when only name is provided (informal provider)', async () => {
    const request = new Request('http://localhost/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verdulería Don Juan',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: expect.any(Number),
      nitCedula: null,
      name: 'Verdulería Don Juan',
      phone: null,
      address: null,
      createdAt: expect.any(String),
    });
  });

  it('should return 409 when NIT/Cedula already exists', async () => {
    // Create first provider
    await mockRepo.save({
      nitCedula: '900.123.456-1',
      name: 'Distribuidora El Triunfo',
      phone: '555-1234',
    });

    const request = new Request('http://localhost/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nitCedula: '900.123.456-1',
        name: 'Otra Distribuidora',
        phone: '555-5678',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toMatchObject({
      error: 'NIT/Cedula already exists',
    });
  });
});
