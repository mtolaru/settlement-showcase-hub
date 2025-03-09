
// Validate and retrieve environment variables
export const validateEnvVars = () => {
  // Get environment variables with validation
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Log environment variable availability (not their values for security)
  console.log('Environment check:', {
    stripeKeyAvailable: !!stripeKey,
    webhookSecretAvailable: !!webhookSecret,
    supabaseUrlAvailable: !!supabaseUrl,
    supabaseKeyAvailable: !!supabaseKey
  });
  
  if (!stripeKey || !webhookSecret) {
    throw new Error('Missing Stripe configuration. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set.');
  }
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }

  return {
    stripeKey,
    webhookSecret,
    supabaseUrl,
    supabaseKey
  };
};
