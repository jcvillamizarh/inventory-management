import { NextRequest, NextResponse } from 'next/server';
import { RegisterMorningEntryUseCase } from '../../../../modules/inventory/use-cases/register-entry.js';
import { DrizzleInventoryRepository } from '../../../../modules/inventory/infrastructure/inventory.drizzle.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const inventoryRepository = new DrizzleInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(inventoryRepository);

    const result = await useCase.execute(body);

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
