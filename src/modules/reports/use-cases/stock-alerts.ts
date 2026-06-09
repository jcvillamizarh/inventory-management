import type { IReportsRepository } from '../reports.repository.js';
import type { IInventoryRepository } from '../../inventory/inventory.repository.js';

export class StockAlertsUseCase {
  constructor(
    private readonly reportsRepository: IReportsRepository,
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  async execute() {
    const alerts = await this.reportsRepository.getProductsBelowMinThreshold(this.inventoryRepository);

    return {
      statusCode: 200,
      data: alerts,
    };
  }
}
