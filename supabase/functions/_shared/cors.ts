// Shared CORS utility for all edge functions
// Restricts origins to known application domains for security.
// NOTE: Lovable preview runs on both *.lovable.app and *.lovableproject.com.

const explicitlyAllowedOrigins = [
  // Local dev
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

function isAllowedBrowserOrigin(origin: string): boolean {
  if (!origin) return false;
  if (explicitlyAllowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);

    // Allow Lovable-hosted domains (published + preview)
    if (url.protocol === 'https:') {
      const host = url.hostname;
      if (host.endsWith('lovable.app')) return true;
      if (host.endsWith('lovableproject.com')) return true;
    }

    // Allow localhost over http/https
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
  } catch {
    // Ignore invalid origin formats
  }

  return false;
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = isAllowedBrowserOrigin(origin) ? origin : 'https://crescendo-nctr-live.lovable.app';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
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
