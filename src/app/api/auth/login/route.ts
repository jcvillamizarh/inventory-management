import { NextRequest, NextResponse } from 'next/server';
import { LoginUseCase } from '../../../../modules/auth/use-cases/login.js';
import { DrizzleAuthRepository } from '../../../../modules/auth/infrastructure/auth.drizzle.js';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const authRepository = new DrizzleAuthRepository();
    const useCase = new LoginUseCase(authRepository);

    const result = await useCase.execute(username, password);

    if (result.statusCode === 200) {
      // Add timestamp for inactivity timeout (4 hours = 14400 seconds)
      const sessionData = JSON.stringify({
        ...result.data,
        createdAt: Date.now(),
      });
      const cookie = serialize('session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // No maxAge or expires - cookie is session-only
      });

      const response = NextResponse.json(result.data, { status: 200 });
      response.headers.set('Set-Cookie', cookie);
      return response;
    } else {
      return NextResponse.json({ error: result.message || 'Authentication failed' }, { status: result.statusCode });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
