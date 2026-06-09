import { NextRequest, NextResponse } from 'next/server';
import { ProcessDailyClosureUseCase } from '../../../../modules/inventory/use-cases/process-closure.js';
import { DrizzleInventoryRepository } from '../../../../modules/inventory/infrastructure/inventory.drizzle.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const inventoryRepository = new DrizzleInventoryRepository();
    const useCase = new ProcessDailyClosureUseCase(inventoryRepository);

    const result = await useCase.execute(body);

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    if (error.statusCode === 409) {
      return NextResponse.json({ error: error.message || 'Closure already exists for this product on this date' }, { status: 409 });
    }
    if (error.statusCode === 422) {
      return NextResponse.json({ error: error.message || 'Physical stock cannot exceed available stock' }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
