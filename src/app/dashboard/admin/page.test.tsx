import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProductUseCase } from '../../../modules/products/use-cases/create-product';
import { IProductRepository } from '../../../modules/products/products.repository';

// Mock repository
class MockProductRepository implements IProductRepository {
  private products: any[] = [];
  
  async findByName(name: string) {
    return this.products.find(p => p.name === name) || null;
  }
  
  async save(product: any) {
    const newProduct = { ...product, id: this.products.length + 1 };
    this.products.push(newProduct);
    return newProduct;
  }
  
  async findById(id: number) {
    return this.products.find(p => p.id === id) || null;
  }
  
  async findAll() {
    return this.products;
  }
  
  async update(id: number, product: any) {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...product };
      return this.products[index];
    }
    return null;
  }
  
  async delete(id: number) {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      return true;
    }
    return false;
  }
}

describe('CreateProductUseCase - Stock Minimo for All Types', () => {
  let useCase: CreateProductUseCase;
  let mockRepository: MockProductRepository;

  beforeEach(() => {
    mockRepository = new MockProductRepository();
    useCase = new CreateProductUseCase(mockRepository);
  });

  it('should accept stockMinimo for PERECEDERO type', async () => {
    const input = {
      name: 'Carne de Res',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 5.0,
      presentationQuantity: 10.0,
    };

    const result = await useCase.execute(input);

    expect(result.statusCode).toBe(201);
    expect(result.data.stockMinimo).toBe(5.0);
  });

  it('should accept stockMinimo for NO_APLICA type', async () => {
    const input = {
      name: 'Bolsas de Empaque',
      category: 'MATERIAL_DE_EMPAQUE',
      type: 'NO_APLICA',
      unitBase: 'UNIDADES',
      stockMinimo: 100.0,
      presentationQuantity: 1.0,
    };

    const result = await useCase.execute(input);

    expect(result.statusCode).toBe(201);
    expect(result.data.stockMinimo).toBe(100.0);
  });

  it('should accept stockMinimo for SECO_NO_PERECEDERO type', async () => {
    const input = {
      name: 'Harina de Trigo',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 20.0,
      presentationQuantity: 1.0,
    };

    const result = await useCase.execute(input);

    expect(result.statusCode).toBe(201);
    expect(result.data.stockMinimo).toBe(20.0);
  });

  it('should require stockMinimo to be greater than 0 for all types', async () => {
    const input = {
      name: 'Producto Test',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 0,
      presentationQuantity: 10.0,
    };

    await expect(useCase.execute(input)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
