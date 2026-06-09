import { NextRequest, NextResponse } from 'next/server';
import { CreateProductUseCase } from '../../../modules/products/use-cases/create-product.js';
import { DrizzleProductRepository } from '../../../modules/products/infrastructure/products.drizzle.js';
import { db } from '../../../lib/db/index.js';
import { products } from '../../../lib/db/schema.js';

export async function GET() {
  try {
    const allProducts = await db.select().from(products);
    return NextResponse.json(allProducts, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const productRepository = new DrizzleProductRepository();
    const useCase = new CreateProductUseCase(productRepository);

    const result = await useCase.execute(body);

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    if (error.statusCode === 409) {
      return NextResponse.json({ error: error.message || 'Product name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
