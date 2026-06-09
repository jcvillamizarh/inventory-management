import { NextRequest, NextResponse } from 'next/server';
import { UpdateProductUseCase } from '../../../../modules/products/use-cases/update-product.js';
import { DrizzleProductRepository } from '../../../../modules/products/infrastructure/products.drizzle.js';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    const productRepository = new DrizzleProductRepository();
    const useCase = new UpdateProductUseCase(productRepository);

    const result = await useCase.execute({ ...body, id });

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    if (error.statusCode === 404) {
      return NextResponse.json({ error: error.message || 'Product not found' }, { status: 404 });
    }
    if (error.statusCode === 409) {
      return NextResponse.json({ error: error.message || 'Product name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
