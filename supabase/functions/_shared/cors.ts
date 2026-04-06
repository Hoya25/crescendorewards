// Shared CORS utility for all edge functions
// All edge functions use header-based authentication (x-sync-secret, authorization, apikey)
// so origin restriction is not needed for security.

export function getCorsHeaders(_req?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-garden-webhook-secret, x-sync-secret',
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
