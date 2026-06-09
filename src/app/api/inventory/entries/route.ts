import { NextRequest, NextResponse } from 'next/server';
import { RegisterMorningEntryUseCase } from '../../../../modules/inventory/use-cases/register-entry.js';
import { DrizzleInventoryRepository } from '../../../../modules/inventory/infrastructure/inventory.drizzle.js';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received body:', body);

    const inventoryRepository = new DrizzleInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(inventoryRepository);

    const result = await useCase.execute(body);

    // Revalidate paths to ensure stock info is updated immediately
    revalidatePath('/dashboard/closure');
    revalidatePath('/dashboard/reports');
    revalidatePath('/api/inventory/stock-info');

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    console.error('Error in POST /api/inventory/entries:', error);
    console.error('Error stack:', error.stack);
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
