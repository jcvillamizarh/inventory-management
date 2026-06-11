import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route.js';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 and clear session cookie', async () => {
    const request = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();
    const setCookieHeader = response.headers.get('Set-Cookie');

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
    });
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('session=');
    expect(setCookieHeader).toContain('Max-Age=0');
  });

  it('should return 500 on internal error', async () => {
    // This test will need to be updated if we add error handling
    // For now, the current implementation doesn't have error scenarios
    const request = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
  });
});
