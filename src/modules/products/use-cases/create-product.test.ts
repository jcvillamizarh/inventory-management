import { describe, it, expect } from 'vitest';
import { CreateProductUseCase } from './create-product.js';
import type { IProductRepository, Product } from '../products.repository.js';

class MockProductRepository implements IProductRepository {
  private products: Product[] = [];

  async findByName(name: string): Promise<Product | null> {
    return this.products.find(p => p.name === name) || null;
  }

  async save(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      id: this.products.length + 1,
      ...product,
    };
    this.products.push(newProduct);
    return newProduct;
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

  it('should fail with 400 if dry product has no stock_minimo or negative value', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    // Dry product without stock_minimo
    await expect(
      useCase.execute({
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: null,
        presentationQuantity: 2.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    // Dry product with negative stock_minimo
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

  it('should succeed with 201 for perishable product and stock_minimo must be null', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Carne de Res',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: null,
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
        stockMinimo: null,
        presentationQuantity: 1.0,
      },
    });
  });

  it('should succeed with 201 for NO_APLICA type (packaging/supplies) and stock_minimo must be null', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Bolsas de Empaque',
      category: 'MATERIAL_DE_EMPAQUE',
      type: 'NO_APLICA',
      unitBase: 'UNIDADES',
      stockMinimo: null,
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
        stockMinimo: null,
        presentationQuantity: 100.0,
      },
    });
  });

  it('should fail with 400 if NO_APLICA type has stock_minimo set', async () => {
    const mockRepo = new MockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(
      useCase.execute({
        name: 'Bolsas de Empaque',
        category: 'MATERIAL_DE_EMPAQUE',
        type: 'NO_APLICA',
        unitBase: 'UNIDADES',
        stockMinimo: 50.0,
        presentationQuantity: 100.0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
