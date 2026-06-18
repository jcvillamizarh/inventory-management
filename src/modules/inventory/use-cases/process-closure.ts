import { z } from 'zod';
import type { IInventoryRepository } from '../inventory.repository.js';

const processClosureSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be a positive integer'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  physicalStock: z.coerce.number().min(0, 'Physical stock cannot be negative'),
});

export class ProcessDailyClosureUseCase {
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async execute(input: unknown) {
    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = processClosureSchema.parse(input);
    } catch (error) {
      throw {
        statusCode: 400,
        message: 'Invalid input data',
      };
    }

    const currentDate = new Date();

    // Check if closure already exists for this product on current date
    const hasExisting = await this.inventoryRepository.hasExistingClosure(
      validatedInput.productId,
      currentDate
    );
    if (hasExisting) {
      throw {
        statusCode: 409,
        message: 'Closure already exists for this product on this date',
      };
    }

    // Get initial stock (from previous day's closure)
    const initialStock = await this.inventoryRepository.getInitialStock(
      validatedInput.productId,
      currentDate
    );

    // Get total entries for the current day
    const totalEntries = await this.inventoryRepository.getTotalEntriesForDay(
      validatedInput.productId,
      currentDate
    );

    // Calculate available stock
    const availableStock = initialStock + totalEntries;

    // Validate logical consistency: physical_stock cannot exceed available stock
    if (validatedInput.physicalStock > availableStock) {
      throw {
        statusCode: 422,
        message: 'Physical stock cannot exceed available stock',
      };
    }

    // Calculate consumption: (initial_stock + total_entries) - physical_stock
    const calculatedConsumption = availableStock - validatedInput.physicalStock;

    // Save closure to repository
    const closure = await this.inventoryRepository.saveClosure({
      productId: validatedInput.productId,
      userId: validatedInput.userId,
      closureDate: currentDate,
      initialStock,
      totalEntries,
      physicalStock: validatedInput.physicalStock,
      calculatedConsumption,
    });

    return {
      statusCode: 200,
      data: {
        id: closure.id,
        productId: closure.productId,
        userId: closure.userId,
        closureDate: closure.closureDate,
        initialStock: closure.initialStock,
        totalEntries: closure.totalEntries,
        physicalStock: closure.physicalStock,
        calculatedConsumption: closure.calculatedConsumption,
      },
    };
  }
}
