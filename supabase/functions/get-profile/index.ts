
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session of the authenticated user
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Get the userId from the request body
    const { userId } = await req.json()
    const targetUserId = userId || session.user.id

    // Only allow users to access their own profile unless they have admin access
    if (targetUserId !== session.user.id) {
      // Check if user has admin role by querying for custom claims or metadata
      const { data: userData } = await supabaseClient.auth.getUser()
      const isAdmin = userData?.user?.app_metadata?.role === 'admin'
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized to access this profile' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        )
      }
    }

    // Query the profile data
    let profile = null
    let dbProfile = null
    
    // First try to get it from the profiles table if it exists
    try {
      const { data: tableProfile, error: tableError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
        
      if (!tableError) {
        dbProfile = tableProfile
      }
    } catch (error) {
      // If profiles table doesn't exist or other error, log and continue
      console.log('Could not retrieve from profiles table:', error)
    }
    
    // Get the user data directly from auth
    const { data: userData, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      return new Response(
        JSON.stringify({ error: `Error fetching user data: ${userError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Combine profile data - prioritize database profile, then fall back to auth user data
    profile = {
      ...dbProfile,
      id: targetUserId,
      email: dbProfile?.email || userData?.user?.email,
      // Add other fields from auth profile if needed
      user_metadata: userData?.user?.user_metadata,
      created_at: dbProfile?.created_at || userData?.user?.created_at
    }

    // Return the profile data
    return new Response(
      JSON.stringify({ profile }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-profile function:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
