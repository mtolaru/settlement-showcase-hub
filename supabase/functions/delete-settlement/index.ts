
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface DeleteRequest {
  settlementId: number
  userId: string
  email?: string
  temporaryId?: string
}

// Add CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the request body
    const { settlementId, userId, email, temporaryId } = await req.json() as DeleteRequest

    if (!settlementId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Settlement ID and User ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Attempting admin deletion of settlement ${settlementId} for user ${userId}`)
    
    // First, check if the settlement exists
    const { data: settlement, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching settlement:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching settlement: ' + fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!settlement) {
      console.log('Settlement not found or already deleted')
      return new Response(
        JSON.stringify({ success: true, message: 'Settlement not found or already deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Found settlement:', settlement)

    // If the settlement is already associated with this user, just delete it
    if (settlement.user_id === userId) {
      console.log('Settlement belongs to current user, proceeding with deletion')
      const { error: deleteError } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId)

      if (deleteError) {
        console.error('Error deleting settlement:', deleteError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to delete settlement: ' + deleteError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      console.log('Settlement deleted successfully')
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to link the settlement to the user first
    if (!settlement.user_id || settlement.user_id !== userId) {
      // Check if email matches
      if (email && settlement.attorney_email === email) {
        console.log('Email matches, updating user_id')
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: userId })
          .eq('id', settlementId)

        if (!updateError) {
          // If update succeeded, delete the settlement
          const { error: deleteError } = await supabase
            .from('settlements')
            .delete()
            .eq('id', settlementId)

          if (deleteError) {
            console.error('Error deleting settlement after update:', deleteError)
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to delete settlement after linking: ' + deleteError.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          console.log('Settlement claimed by email and deleted successfully')
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          console.error('Error updating settlement:', updateError)
        }
      }

      // Check if temporary ID matches
      if (temporaryId && settlement.temporary_id === temporaryId) {
        console.log('Temporary ID matches, updating user_id')
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: userId })
          .eq('id', settlementId)

        if (!updateError) {
          // If update succeeded, delete the settlement
          const { error: deleteError } = await supabase
            .from('settlements')
            .delete()
            .eq('id', settlementId)

          if (deleteError) {
            console.error('Error deleting settlement after temporary ID update:', deleteError)
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to delete settlement after linking by temporary ID: ' + deleteError.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          console.log('Settlement claimed by temporary ID and deleted successfully')
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          console.error('Error updating settlement by temporary ID:', updateError)
        }
      }
    }

    // As a last resort, try to force delete the settlement
    console.log('Attempting force delete as last resort')
    const { error: forceDeleteError } = await supabase
      .from('settlements')
      .delete()
      .eq('id', settlementId)

    if (forceDeleteError) {
      console.error('Force delete failed:', forceDeleteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Force delete failed: ' + forceDeleteError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Settlement force deleted successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'Settlement force deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
