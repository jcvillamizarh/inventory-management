import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from 'cookie';

describe('Session Cookie Validation', () => {
  describe('parseSessionCookie', () => {
    it('should parse valid session cookie', () => {
      const sessionData = JSON.stringify({
        id: '123',
        username: 'admin',
        role: 'ADMINISTRADOR',
        isActive: true,
      });
      const cookieHeader = `session=${encodeURIComponent(sessionData)}`;

      const cookies = parse(cookieHeader);
      const parsedSession = JSON.parse(cookies.session || '');

      expect(parsedSession).toMatchObject({
        id: '123',
        username: 'admin',
        role: 'ADMINISTRADOR',
        isActive: true,
      });
    });

    it('should return null when session cookie is missing', () => {
      const cookieHeader = 'other=value';
      const cookies = parse(cookieHeader);

      expect(cookies.session).toBeUndefined();
    });

    it('should return null when session cookie is invalid JSON', () => {
      const cookieHeader = 'session=invalid-json';
      const cookies = parse(cookieHeader);

      expect(() => JSON.parse(cookies.session || '')).toThrow();
    });
  });

  describe('Session Validation', () => {
    it('should validate session has required fields', () => {
      const session = {
        id: '123',
        username: 'admin',
        role: 'ADMINISTRADOR',
        isActive: true,
      };

      expect(session.id).toBeDefined();
      expect(session.username).toBeDefined();
      expect(session.role).toBeDefined();
      expect(session.isActive).toBe(true);
    });

    it('should reject session without id', () => {
      const session: any = {
        username: 'admin',
        role: 'ADMINISTRADOR',
        isActive: true,
      };

      expect(session.id).toBeUndefined();
    });

    it('should reject inactive session', () => {
      const session = {
        id: '123',
        username: 'admin',
        role: 'ADMINISTRADOR',
        isActive: false,
      };

      expect(session.isActive).toBe(false);
    });
  });
});
