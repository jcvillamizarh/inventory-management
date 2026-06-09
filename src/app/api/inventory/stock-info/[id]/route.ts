import { NextRequest, NextResponse } from 'next/server';
import { DrizzleInventoryRepository } from '../../../../../modules/inventory/infrastructure/inventory.drizzle.js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const productId = parseInt(idParam);

    const inventoryRepository = new DrizzleInventoryRepository();
    
    // Use getLatestPhysicalStock to get the current actual stock
    const currentStock = await inventoryRepository.getLatestPhysicalStock(productId);

    return NextResponse.json({
      currentStock,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching stock info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
