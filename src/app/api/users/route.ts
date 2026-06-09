import { NextRequest, NextResponse } from 'next/server';
import { CreateUserUseCase } from '../../../modules/users/use-cases/create-user.js';
import { DrizzleUserRepository } from '../../../modules/users/infrastructure/users.drizzle.js';

export async function GET() {
  try {
    const userRepository = new DrizzleUserRepository();
    const users = await userRepository.findAll();

    // Return users without password hash for security
    const safeUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.isActive,
    }));

    return NextResponse.json(safeUsers, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userRepository = new DrizzleUserRepository();
    const useCase = new CreateUserUseCase(userRepository);

    const result = await useCase.execute(body);

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return NextResponse.json({ error: error.message || 'Invalid input data' }, { status: 400 });
    }
    if (error.statusCode === 409) {
      return NextResponse.json({ error: error.message || 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
