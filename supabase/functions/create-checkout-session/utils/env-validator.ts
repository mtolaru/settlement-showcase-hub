
// Validate and retrieve environment variables
export const validateEnvVars = () => {
  // Get and validate environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  // Log environment variable availability (not values for security)
  console.log('Environment check:', {
    supabaseUrlAvailable: !!supabaseUrl,
    supabaseKeyAvailable: !!supabaseKey,
    stripeKeyAvailable: !!stripeKey
  });
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }
  
  if (!stripeKey) {
    throw new Error('Missing Stripe configuration. STRIPE_SECRET_KEY must be set.');
  }
  
  return { supabaseUrl, supabaseKey, stripeKey };
};
