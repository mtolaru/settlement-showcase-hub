
import { supabase, getSiteUrl } from "@/integrations/supabase/client";

/**
 * Handles authentication-related operations with proper type handling
 */
export const authService = {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const siteUrl = getSiteUrl();
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: metadata || {}
      }
    });
  },

  /**
   * Reset password with email
   */
  async resetPasswordForEmail(email: string) {
    const siteUrl = getSiteUrl();
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });
  },

  /**
   * Update user's password
   */
  async updatePassword(password: string) {
    return await supabase.auth.updateUser({
      password
    });
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    return await supabase.auth.signOut();
  },

  /**
   * Get the current session
   */
  async getSession() {
    return await supabase.auth.getSession();
  },

  /**
   * Get the current user
   */
  async getUser() {
    return await supabase.auth.getUser();
  },

  /**
   * Associate a temporary ID with the current user
   */
  async linkTemporaryId(temporaryId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No user found" };
    
    const { error } = await supabase.auth.updateUser({
      data: { temporaryId }
    });
    
    return { success: !error, error: error?.message };
  }
};
