import { NextResponse } from 'next/server';
import { GeneralInventoryReportUseCase } from '../../../../modules/reports/use-cases/general-inventory-report.js';
import { DrizzleProductRepository } from '../../../../modules/products/infrastructure/products.drizzle.js';
import { DrizzleInventoryRepository } from '../../../../modules/inventory/infrastructure/inventory.drizzle.js';

export async function GET() {
  try {
    const productRepository = new DrizzleProductRepository();
    const inventoryRepository = new DrizzleInventoryRepository();
    const useCase = new GeneralInventoryReportUseCase(productRepository, inventoryRepository);

    const result = await useCase.execute();

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error generating general inventory report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
