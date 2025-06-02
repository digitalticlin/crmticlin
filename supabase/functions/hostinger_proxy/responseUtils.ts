
import { CORS_HEADERS } from './config.ts';

export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { 
      status, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}

export function createErrorResponse(error: string, code?: string, status = 500): Response {
  const body: any = { success: false, error };
  if (code) body.code = code;
  
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}

export function createNotFoundResponse(path: string, method: string): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: `Endpoint não encontrado: ${path}`,
      code: 'ENDPOINT_NOT_FOUND',
      available_endpoints: ['/health', '/status', '/execute'],
      debug_info: {
        processed_path: path,
        method: method
      }
    }),
    { 
      status: 404, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}
