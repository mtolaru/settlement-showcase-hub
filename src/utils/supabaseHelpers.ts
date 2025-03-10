
import { supabase } from "@/integrations/supabase/client";
import { safeGet } from "@/utils/dbTypeHelpers";

/**
 * Helper class for common Supabase operations
 */
export class SupabaseHelper {
  /**
   * Check if a user exists with the given email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking if user exists by email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception checking if user exists by email:', error);
      return false;
    }
  }

  /**
   * Update a user's profile
   */
  async updateUserProfile(userId: string, profileData: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  /**
   * Safely get a property from a Supabase query result
   */
  safeProperty<T extends object, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
    return safeGet(obj, key, defaultValue);
  }
}

export const supabaseHelper = new SupabaseHelper();
