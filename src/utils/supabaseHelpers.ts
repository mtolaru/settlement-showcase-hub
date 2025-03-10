
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
      // Instead of directly querying the profiles table, we use the auth API
      // to check if a user with this email exists
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
        filter: {
          email: email
        }
      });

      if (error) {
        console.error('Error checking if user exists by email:', error);
        return false;
      }

      return data.users.length > 0;
    } catch (error) {
      console.error('Exception checking if user exists by email:', error);
      return false;
    }
  }

  /**
   * Update a user's profile data
   * Note: This assumes a profiles table exists in the public schema
   */
  async updateUserProfile(userId: string, profileData: Record<string, any>): Promise<boolean> {
    try {
      // First check if the profile exists
      const { data: existingProfile } = await supabase
        .rpc('get_profile_by_id', { user_id: userId });

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .rpc('update_profile', { 
            user_id: userId,
            profile_data: profileData
          });
        return !error;
      } else {
        // Create new profile using RPC function
        const { error } = await supabase
          .rpc('create_profile', { 
            user_id: userId,
            profile_data: profileData
          });
        return !error;
      }
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
