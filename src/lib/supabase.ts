// Backwards-compatible wrapper.
// Many files import `supabase` from here; we re-export the project's primary client.
// NOTE: Do not create a second hardcoded client — it breaks backend functions (like checkout) by pointing at the wrong project.
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Some admin/dev tools build function URLs manually; keep these exports stable.
// (Vite only exposes variables prefixed with VITE_.)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
