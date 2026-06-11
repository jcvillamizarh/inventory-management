import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '../../../../lib/auth/session.js';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: 'No valid session' }, { status: 401 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
