import { z } from 'zod';
import type { IInventoryRepository } from '../inventory.repository.js';

const registerEntrySchema = z.object({
  providerId: z.number().int().positive('Provider ID must be a positive integer'),
  productId: z.number().int().positive('Product ID must be a positive integer'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  entryDate: z.string().or(z.date()).refine((val) => {
    const date = typeof val === 'string' ? new Date(val) : val;
    return !isNaN(date.getTime());
  }, 'Entry date must be a valid date'),
  expirationDate: z.string().or(z.date()).refine((val) => {
    const date = typeof val === 'string' ? new Date(val) : val;
    return !isNaN(date.getTime());
  }, 'Expiration date must be a valid date'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantityUnits: z.number().positive('Quantity units must be a positive number'),
}).refine((data) => {
  const entryDate = typeof data.entryDate === 'string' ? new Date(data.entryDate) : data.entryDate;
  const expirationDate = typeof data.expirationDate === 'string' ? new Date(data.expirationDate) : data.expirationDate;
  return expirationDate >= entryDate;
}, {
  message: 'Expiration date must be greater than or equal to entry date',
  path: ['expirationDate'],
});

export class RegisterMorningEntryUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async execute(input: unknown) {
    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = registerEntrySchema.parse(input);
    } catch (error) {
      throw {
        statusCode: 400,
        message: 'Invalid input data',
      };
    }

    // Convert dates to Date objects if they are strings
    const entryDate = typeof validatedInput.entryDate === 'string' ? new Date(validatedInput.entryDate) : validatedInput.entryDate;
    const expirationDate = typeof validatedInput.expirationDate === 'string' ? new Date(validatedInput.expirationDate) : validatedInput.expirationDate;

    // Save entry to repository
    const entry = await this.inventoryRepository.saveEntry({
      providerId: validatedInput.providerId,
      productId: validatedInput.productId,
      userId: validatedInput.userId,
      entryDate,
      expirationDate,
      batchNumber: validatedInput.batchNumber,
      quantityUnits: validatedInput.quantityUnits,
    });

    return {
      statusCode: 201,
      data: {
        id: entry.id,
        providerId: entry.providerId,
        productId: entry.productId,
        userId: entry.userId,
        entryDate: entry.entryDate,
        expirationDate: entry.expirationDate,
        batchNumber: entry.batchNumber,
        quantityUnits: entry.quantityUnits,
        createdAt: entry.createdAt,
      },
    };
  }
}
