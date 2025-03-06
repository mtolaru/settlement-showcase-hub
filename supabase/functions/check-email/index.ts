
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Checking if email exists: ${normalizedEmail}`);
    
    // Check settlements table
    const { data: settlementData, error: settlementError } = await supabase
      .from('settlements')
      .select('attorney_email')
      .ilike('attorney_email', normalizedEmail)
      .limit(1);
    
    if (settlementError) {
      console.error('Error checking settlements table:', settlementError);
    }
    
    const emailExistsInSettlements = settlementData && settlementData.length > 0;
    
    if (emailExistsInSettlements) {
      console.log('Email found in settlements table');
      return new Response(
        JSON.stringify({ exists: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check auth.users using admin API
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('Error listing users:', usersError);
      } else if (users) {
        const existingUser = users.users.find(
          user => user.email && user.email.toLowerCase() === normalizedEmail
        );
        
        if (existingUser) {
          console.log('Email found in auth.users');
          return new Response(
            JSON.stringify({ exists: true }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    } catch (e) {
      console.error('Error checking auth.users:', e);
    }
    
    console.log('Email not found in any table');
    return new Response(
      JSON.stringify({ exists: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in check-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
