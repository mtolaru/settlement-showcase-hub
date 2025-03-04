
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get request body
    const body = await req.json()
    const { settlements } = body

    if (!settlements || !Array.isArray(settlements) || settlements.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid settlements data. Expected an array of settlement objects.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing ${settlements.length} settlements`)
    
    // Process settlements in chunks to avoid timeouts
    const CHUNK_SIZE = 20
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < settlements.length; i += CHUNK_SIZE) {
      const chunk = settlements.slice(i, i + CHUNK_SIZE)
      
      // Map each settlement to match the database schema
      const processedSettlements = chunk.map(settlement => {
        // Set payment_completed to true for imported settlements
        const processedSettlement = {
          amount: Number(settlement.amount),
          attorney: settlement.attorney,
          firm: settlement.firm,
          location: settlement.location,
          type: settlement.type,
          initial_offer: Number(settlement.initial_offer),
          policy_limit: Number(settlement.policy_limit),
          medical_expenses: Number(settlement.medical_expenses),
          settlement_phase: settlement.settlement_phase,
          settlement_date: settlement.settlement_date,
          case_description: settlement.case_description,
          firm_website: settlement.firm_website,
          photo_url: settlement.photo_url,
          payment_completed: true,
          attorney_email: settlement.attorney_email || null,
          created_at: new Date().toISOString(),
          temporary_id: crypto.randomUUID()
        }
        
        return processedSettlement
      })

      // Insert chunk into settlements table
      const { data, error } = await supabase
        .from('settlements')
        .insert(processedSettlements)
        .select('id')

      if (error) {
        console.error(`Error inserting chunk ${i / CHUNK_SIZE}:`, error)
        results.failed += chunk.length
        results.errors.push({
          chunk: i / CHUNK_SIZE,
          error: error.message
        })
      } else {
        console.log(`Successfully inserted chunk ${i / CHUNK_SIZE}`)
        results.success += (data?.length || 0)
      }
    }

    return new Response(
      JSON.stringify({
        message: `Import complete. Successfully imported ${results.success} settlements. Failed: ${results.failed}`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error during import:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
