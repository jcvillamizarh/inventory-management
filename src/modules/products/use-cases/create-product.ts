import { z } from 'zod';
import type { IProductRepository } from '../products.repository.js';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['MATERIA_PRIMA', 'PRODUCTO_TERMINADO', 'MATERIAL_DE_EMPAQUE', 'PRODUCTOS_L_D']),
  type: z.enum(['SECO_NO_PERECEDERO', 'PERECEDERO', 'NO_APLICA']),
  unitBase: z.enum(['KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS']),
  stockMinimo: z.number().min(0, 'Stock minimo must be 0 or greater'),
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

    // Business rule: stockMinimo must be positive for all product types
    if (validatedInput.stockMinimo <= 0) {
      throw {
        statusCode: 400,
        message: 'Stock minimo must be greater than 0',
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
