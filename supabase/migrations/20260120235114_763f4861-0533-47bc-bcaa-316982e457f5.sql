-- Create table to store authentication nonces for wallet challenge-response
CREATE TABLE public.auth_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
    used BOOLEAN NOT NULL DEFAULT false
);

-- Create index for fast lookups
CREATE INDEX idx_auth_nonces_wallet ON public.auth_nonces(wallet_address);
CREATE INDEX idx_auth_nonces_nonce ON public.auth_nonces(nonce);
CREATE INDEX idx_auth_nonces_expires ON public.auth_nonces(expires_at);

-- Enable RLS
ALTER TABLE public.auth_nonces ENABLE ROW LEVEL SECURITY;

-- Only service role can access nonces (edge functions)
CREATE POLICY "Service role only access"
ON public.auth_nonces
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create function to clean up expired nonces (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.auth_nonces 
    WHERE expires_at < now() OR used = true;
END;
$$;