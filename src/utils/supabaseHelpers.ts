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
      // Using the custom edge function to check if a user exists
      const { data, error } = await supabase.functions.invoke('check-email', {
        body: { email }
      });

      if (error) {
        console.error('Error checking if user exists by email:', error);
        return false;
      }

      return data?.exists || false;
    } catch (error) {
      console.error('Exception checking if user exists by email:', error);
      return false;
    }
  }

  /**
   * Update a user's profile data
   */
  async updateUserProfile(userId: string, profileData: Record<string, any>): Promise<boolean> {
    try {
      // Use the get-profile edge function to check if profile exists
      const { data: existingProfileData, error: getProfileError } = await supabase.functions.invoke('get-profile', {
        body: { userId }
      });
      
      if (getProfileError) {
        console.error('Error retrieving profile:', getProfileError);
        return false;
      }
      
      const existingProfile = existingProfileData?.profile;
      
      // If profile exists, update it through a direct authenticated call
      // Otherwise, this would be handled through registration process
      if (existingProfile) {
        const { error } = await supabase.auth.updateUser({
          data: profileData
        });
        
        return !error;
      } else {
        console.warn('Profile not found for user ID:', userId);
        return false;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  /**
   * Get a user's profile by ID
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('get-profile', {
        body: { userId }
      });
      
      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }
      
      return data?.profile || null;
    } catch (error) {
      console.error('Exception getting user profile:', error);
      return null;
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
