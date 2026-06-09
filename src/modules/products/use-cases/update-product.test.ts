import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateProductUseCase } from './update-product.js';
import type { IProductRepository } from '../products.repository.js';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let mockRepo: IProductRepository;

  beforeEach(() => {
    mockRepo = {
      findById: async () => null,
      findByName: async () => null,
      save: async () => ({
        id: 1,
        name: 'Test Product',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10,
        presentationQuantity: 1,
      }),
      update: async () => ({
        id: 1,
        name: 'Updated Product',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 15,
        presentationQuantity: 2,
      }),
    } as IProductRepository;

    useCase = new UpdateProductUseCase(mockRepo);
  });

  it('should update a product successfully', async () => {
    mockRepo.findById = async () => ({
      id: 1,
      name: 'Old Name',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10,
      presentationQuantity: 1,
    });

    const input = {
      id: 1,
      name: 'Updated Product',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 15,
      presentationQuantity: 2,
    };

    const result = await useCase.execute(input);

    expect(result.statusCode).toBe(200);
    expect(result.data.name).toBe('Updated Product');
    expect(result.data.stockMinimo).toBe(15);
  });

  it('should return 404 if product does not exist', async () => {
    mockRepo.findById = async () => null;

    const input = {
      id: 999,
      name: 'Updated Product',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 15,
      presentationQuantity: 2,
    };

    await expect(useCase.execute(input)).rejects.toEqual({
      statusCode: 404,
      message: 'Product not found',
    });
  });

  it('should return 409 if name already exists for another product', async () => {
    mockRepo.findById = async () => ({
      id: 1,
      name: 'Old Name',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10,
      presentationQuantity: 1,
    });

    mockRepo.findByName = async () => ({
      id: 2,
      name: 'Existing Name',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10,
      presentationQuantity: 1,
    });

    const input = {
      id: 1,
      name: 'Existing Name',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 15,
      presentationQuantity: 2,
    };

    await expect(useCase.execute(input)).rejects.toEqual({
      statusCode: 409,
      message: 'Product name already exists',
    });
  });

  it('should validate stockMinimo for SECO_NO_PERECEDERO type', async () => {
    mockRepo.findById = async () => ({
      id: 1,
      name: 'Old Name',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10,
      presentationQuantity: 1,
    });

    const input = {
      id: 1,
      name: 'Updated Product',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: null,
      presentationQuantity: 2,
    };

    await expect(useCase.execute(input)).rejects.toEqual({
      statusCode: 400,
      message: 'Stock minimo is required and must be positive for dry products',
    });
  });

  it('should validate stockMinimo for PERECEDERO type', async () => {
    mockRepo.findById = async () => ({
      id: 1,
      name: 'Old Name',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: null,
      presentationQuantity: 1,
    });

    const input = {
      id: 1,
      name: 'Updated Product',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10,
      presentationQuantity: 2,
    };

    await expect(useCase.execute(input)).rejects.toEqual({
      statusCode: 400,
      message: 'Stock minimo must be null for perishable products',
    });
  });
});
