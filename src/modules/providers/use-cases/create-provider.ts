import { z } from 'zod';
import type { IProviderRepository } from '../providers.repository.js';

const createProviderSchema = z.object({
  nitCedula: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export class CreateProviderUseCase {
  constructor(private readonly providerRepository: IProviderRepository) {}

  async execute(input: unknown) {
    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = createProviderSchema.parse(input);
    } catch (error) {
      throw {
        statusCode: 400,
        message: 'Invalid input data',
      };
    }

    // Check if NIT/Cedula already exists (only if provided)
    if (validatedInput.nitCedula) {
      const existingProvider = await this.providerRepository.findByNitCedula(validatedInput.nitCedula);
      if (existingProvider) {
        throw {
          statusCode: 409,
          message: 'NIT/Cedula already exists',
        };
      }
    }

    // Save provider to repository
    const provider = await this.providerRepository.save({
      nitCedula: validatedInput.nitCedula || null,
      name: validatedInput.name,
      phone: validatedInput.phone || null,
      address: validatedInput.address || null,
    });

    return {
      statusCode: 201,
      data: {
        id: provider.id,
        nitCedula: provider.nitCedula,
        name: provider.name,
        phone: provider.phone,
        address: provider.address,
        createdAt: provider.createdAt,
      },
    };
  }
}
