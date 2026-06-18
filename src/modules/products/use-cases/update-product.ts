import { z } from 'zod';
import type { IProductRepository } from '../products.repository.js';

const updateProductSchema = z.object({
  id: z.number().positive('ID must be positive'),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['MATERIA_PRIMA', 'PRODUCTO_TERMINADO', 'MATERIAL_DE_EMPAQUE', 'PRODUCTOS_L_D']),
  type: z.enum(['SECO_NO_PERECEDERO', 'PERECEDERO', 'NO_APLICA']),
  unitBase: z.enum(['KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS']),
  stockMinimo: z.number().min(0, 'Stock minimo must be 0 or greater'),
  presentationQuantity: z.number().positive('Presentation quantity must be greater than 0'),
});

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: unknown) {
    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = updateProductSchema.parse(input);
    } catch (error) {
      throw {
        statusCode: 400,
        message: 'Invalid input data',
      };
    }

    // Check if product exists
    const existingProduct = await this.productRepository.findById(validatedInput.id);
    if (!existingProduct) {
      throw {
        statusCode: 404,
        message: 'Product not found',
      };
    }

    // Check if name already exists for another product
    if (validatedInput.name !== existingProduct.name) {
      const productWithSameName = await this.productRepository.findByName(validatedInput.name);
      if (productWithSameName && productWithSameName.id !== validatedInput.id) {
        throw {
          statusCode: 409,
          message: 'Product name already exists',
        };
      }
    }

    // Business rule: stockMinimo must be positive for all product types
    if (validatedInput.stockMinimo <= 0) {
      throw {
        statusCode: 400,
        message: 'Stock minimo must be greater than 0',
      };
    }

    // Update product in repository
    const product = await this.productRepository.update(validatedInput.id, {
      name: validatedInput.name,
      category: validatedInput.category,
      type: validatedInput.type,
      unitBase: validatedInput.unitBase,
      stockMinimo: validatedInput.stockMinimo,
      presentationQuantity: validatedInput.presentationQuantity,
    });

    if (!product) {
      throw {
        statusCode: 404,
        message: 'Product not found',
      };
    }

    return {
      statusCode: 200,
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
