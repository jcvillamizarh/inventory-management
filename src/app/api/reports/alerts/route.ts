import { NextRequest, NextResponse } from 'next/server';
import { StockAlertsUseCase } from '../../../../modules/reports/use-cases/stock-alerts.js';
import { DrizzleReportsRepository } from '../../../../modules/reports/infrastructure/reports.drizzle.js';
import { DrizzleInventoryRepository } from '../../../../modules/inventory/infrastructure/inventory.drizzle.js';

export async function GET(request: NextRequest) {
  try {
    const reportsRepository = new DrizzleReportsRepository();
    const inventoryRepository = new DrizzleInventoryRepository();
    const useCase = new StockAlertsUseCase(reportsRepository, inventoryRepository);

    const result = await useCase.execute();

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
