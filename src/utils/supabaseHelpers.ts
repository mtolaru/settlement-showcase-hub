
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { extractData, safeGet } from './dbTypeHelpers';

/**
 * Type-safe wrapper for Supabase queries
 */
export class SafeSupabaseClient {
  private client: SupabaseClient<Database>;
  
  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }
  
  /**
   * Safely perform a query and extract the data
   */
  async safeQuery<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: any, error: any }>,
    defaultValue: T
  ): Promise<T> {
    try {
      const { data, error } = await queryFn(this.client);
      
      if (error) {
        console.error('Query error:', error);
        return defaultValue;
      }
      
      return extractData(data, defaultValue);
    } catch (err) {
      console.error('Exception in query:', err);
      return defaultValue;
    }
  }
  
  /**
   * Safely get a property from a Supabase query result
   */
  safeProperty<T extends object, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
    return safeGet(obj, key, defaultValue);
  }
}
