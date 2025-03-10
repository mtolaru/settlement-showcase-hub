
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const createTypedSupabaseClient = (supabaseUrl: string, supabaseKey: string): SupabaseClient<Database> => {
  return createClient<Database>(supabaseUrl, supabaseKey);
};

export default createTypedSupabaseClient;
