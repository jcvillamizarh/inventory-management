import { cookies } from 'next/headers';
import { parse } from 'cookie';

export interface SessionUser {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt?: number;
}

const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Validate session structure
    if (!sessionData.id || !sessionData.username || !sessionData.role) {
      return null;
    }

    // Check inactivity timeout
    if (sessionData.createdAt) {
      const sessionAge = Date.now() - sessionData.createdAt;
      if (sessionAge > SESSION_TIMEOUT_MS) {
        return null; // Session expired due to inactivity
      }
    }

    return sessionData as SessionUser;
  } catch (error) {
    return null;
  }
}

export function parseSessionCookie(cookieHeader: string): SessionUser | null {
  try {
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.session;

    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie);

    // Validate session structure
    if (!sessionData.id || !sessionData.username || !sessionData.role) {
      return null;
    }

    // Check inactivity timeout
    if (sessionData.createdAt) {
      const sessionAge = Date.now() - sessionData.createdAt;
      if (sessionAge > SESSION_TIMEOUT_MS) {
        return null; // Session expired due to inactivity
      }
    }

    return sessionData as SessionUser;
  } catch (error) {
    return null;
  }
}
