import { NextRequest, NextResponse } from 'next/server';
import { CreateProviderUseCase } from '../../../modules/providers/use-cases/create-provider.js';
import { DrizzleProviderRepository } from '../../../modules/providers/infrastructure/providers.drizzle.js';
import { db } from '../../../lib/db/index.js';
import { providers } from '../../../lib/db/schema.js';

export async function GET() {
  try {
    const allProviders = await db.select().from(providers);
    return NextResponse.json(allProviders, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const providerRepository = new DrizzleProviderRepository();
    const useCase = new CreateProviderUseCase(providerRepository);

    const result = await useCase.execute(body);

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    if (error.statusCode === 409) {
      return NextResponse.json({ error: error.message || 'NIT/Cedula already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
