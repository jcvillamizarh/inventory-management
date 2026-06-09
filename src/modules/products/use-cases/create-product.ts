import { z } from 'zod';
import type { IProductRepository } from '../products.repository.js';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['MATERIA_PRIMA', 'PRODUCTO_TERMINADO', 'MATERIAL_DE_EMPAQUE', 'PRODUCTOS_L_D']),
  type: z.enum(['SECO_NO_PERECEDERO', 'PERECEDERO']),
  unitBase: z.enum(['KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS']),
  stockMinimo: z.number().nullable(),
  presentationQuantity: z.number().positive('Presentation quantity must be greater than 0'),
});

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: unknown) {
    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = createProductSchema.parse(input);
    } catch (error) {
      throw {
        statusCode: 400,
        message: 'Invalid input data',
      };
    }

    // Business rule: If type is SECO_NO_PERECEDERO, stockMinimo must be positive
    if (validatedInput.type === 'SECO_NO_PERECEDERO') {
      if (validatedInput.stockMinimo === null || validatedInput.stockMinimo <= 0) {
        throw {
          statusCode: 400,
          message: 'Stock minimo is required and must be positive for dry products',
        };
      }
    }

    // Business rule: If type is PERECEDERO, stockMinimo must be null
    if (validatedInput.type === 'PERECEDERO' && validatedInput.stockMinimo !== null) {
      throw {
        statusCode: 400,
        message: 'Stock minimo must be null for perishable products',
      };
    }

    // Check if product name already exists
    const existingProduct = await this.productRepository.findByName(validatedInput.name);
    if (existingProduct) {
      throw {
        statusCode: 409,
        message: 'Product name already exists',
      };
    }

    // Save product to repository
    const product = await this.productRepository.save({
      name: validatedInput.name,
      category: validatedInput.category,
      type: validatedInput.type,
      unitBase: validatedInput.unitBase,
      stockMinimo: validatedInput.stockMinimo,
      presentationQuantity: validatedInput.presentationQuantity,
    });

    return {
      statusCode: 201,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        type: product.type,
        unitBase: product.unitBase,
        stockMinimo: product.stockMinimo,
        presentationQuantity: product.presentationQuantity,
      },
    };
  }
}
