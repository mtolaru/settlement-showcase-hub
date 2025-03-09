
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Create and configure Supabase client
export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey);
};
