// External Supabase client connecting to The Garden's shared database
// This enables unified user profiles across Crescendo and The Garden platforms
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// The Garden's shared Supabase project credentials
const EXTERNAL_SUPABASE_URL = 'https://rndivcsonsojgelzewkb.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZGl2Y3NvbnNvamdlbHpld2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzEwNTksImV4cCI6MjA3NDA0NzA1OX0.N4_RL-IclVLuTmAhoHRZvSgNfNKfivLg5mS2_rgNtuc';

// Log connection for verification
console.log('Connected to Supabase:', EXTERNAL_SUPABASE_URL);

// Create and export the external Supabase client
export const supabase = createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export URL for edge function calls
export const SUPABASE_URL = EXTERNAL_SUPABASE_URL;
export const SUPABASE_ANON_KEY = EXTERNAL_SUPABASE_ANON_KEY;
