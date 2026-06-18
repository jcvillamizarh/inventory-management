import { describe, it, expect } from 'vitest';
import { CreateProductUseCase } from './create-product.js';
import type { IProductRepository, Product } from '../products.repository.js';

class MockProductRepository implements IProductRepository {
  private products: Product[] = [];

  async findByName(name: string): Promise<Product | null> {
    return this.products.find(p => p.name === name) || null;
  }

  async findById(id: number): Promise<Product | null> {
    return this.products.find(p => p.id === id) || null;
  }

  async findAll(): Promise<Product[]> {
    return this.products;
  }

  async save(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      id: this.products.length + 1,
      ...product,
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async update(id: number, product: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...product };
      return this.products[index];
    }
    return null;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      return true;
    }
    return false;
  }

  clear() {
    this.products = [];
  }
}

describe('CreateProductUseCase', () => {
  it('should fail with 409 if product name already exists', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    // First product created successfully
    await useCase.execute({
      name: 'Harina de Trigo',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10.5,
      presentationQuantity: 2.0,
    });

    // Attempt to create duplicate name
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 15.0,
        presentationQuantity: 5.0,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Product name already exists',
    });
  });

  it('should fail with 400 if input data does not match Zod schema', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    // Empty name
    await expect(
      useCase.execute({
        name: '',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 2.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Invalid category
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'INVALID_CATEGORY' as any,
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 2.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Negative presentationQuantity
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: -1.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Zero presentationQuantity
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should fail with 400 if product has stock_minimo of 0 or negative value', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    // Product with zero stock_minimo
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 0,
        presentationQuantity: 2.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Product with negative stock_minimo
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: -5.0,
        presentationQuantity: 2.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should succeed with 201 for dry product with valid stock_minimo', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Harina de Trigo',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10.5,
      presentationQuantity: 2.0,
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 2.0,
      },
    });
  });

  it('should succeed with 201 for perishable product with valid stock_minimo', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Carne de Res',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 5.0,
      presentationQuantity: 1.0,
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        name: 'Carne de Res',
        category: 'MATERIA_PRIMA',
        type: 'PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 5.0,
        presentationQuantity: 1.0,
      },
    });
  });

  it('should succeed with 201 for NO_APLICA type (packaging/supplies) with valid stock_minimo', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Bolsas de Empaque',
      category: 'MATERIAL_DE_EMPAQUE',
      type: 'NO_APLICA',
      unitBase: 'UNIDADES',
      stockMinimo: 50.0,
      presentationQuantity: 100.0,
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        name: 'Bolsas de Empaque',
        category: 'MATERIAL_DE_EMPAQUE',
        type: 'NO_APLICA',
        unitBase: 'UNIDADES',
        stockMinimo: 50.0,
        presentationQuantity: 100.0,
      },
    });
  });
});
