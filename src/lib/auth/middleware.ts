export interface AuthContext {
  userId: string;
  role: string;
}

export function checkRolePermission(role: string, method: string, path: string): boolean {
  // CONSULTA role can only access GET requests
  if (role === 'CONSULTA') {
    return method === 'GET';
  }

  // Other roles (ADMIN, OPERADOR) have full access
  return true;
}

export function withRoleProtection(handler: (request: Request, authContext: AuthContext) => Promise<Response>) {
  return async (request: Request, authContext: AuthContext): Promise<Response> => {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    if (!checkRolePermission(authContext.role, method, path)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: CONSULTA role cannot perform write operations' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, authContext);
  };
}
