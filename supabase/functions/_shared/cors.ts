// Shared CORS utility for all edge functions
// Restricts origins to known application domains for security

const allowedOrigins = [
  'https://crescendo-nctr-live.lovable.app',
  'https://id-preview--b7bca209-cde6-4446-b370-04f75ce9b6da.lovable.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  
  // Check if origin is in allowed list
  const allowedOrigin = allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // Default to production URL
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-garden-webhook-secret',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
