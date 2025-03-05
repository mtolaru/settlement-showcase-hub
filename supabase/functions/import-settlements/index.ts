import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const { settlements } = await req.json();
    
    if (!Array.isArray(settlements) || settlements.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid settlements data. Expected a non-empty array.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const errors: string[] = [];
    const requiredFields = [
      'amount', 'attorney', 'firm', 'location', 'type',
      'initial_offer', 'policy_limit', 'medical_expenses',
      'settlement_phase', 'settlement_date', 'case_description'
    ];
    const optionalFields = ['firm_website', 'photo_url', 'attorney_email'];

    console.log("Sample settlement to import:", settlements[0]);

    // Process photo URLs to make sure they have the right path
    const processedSettlements = settlements.map((settlement: any) => {
      // If photo_url already contains processed_images, leave it as is
      // Otherwise, update the path to include processed_images
      if (settlement.photo_url && !settlement.photo_url.includes('processed_images')) {
        const urlParts = settlement.photo_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        if (filename) {
          settlement.photo_url = settlement.photo_url.replace(
            filename, 
            `processed_images/${filename}`
          );
        }
      }
      
      // Ensure settlement_date is in the correct format
      if (settlement.settlement_date && typeof settlement.settlement_date === 'string') {
        // Try to parse the date to ensure it's valid
        try {
          const date = new Date(settlement.settlement_date);
          if (!isNaN(date.getTime())) {
            settlement.settlement_date = date.toISOString();
          }
        } catch (e) {
          console.error(`Invalid date format for settlement: ${settlement.settlement_date}`);
        }
      }
      
      return settlement;
    });

    // Validate all settlements before import
    const validSettlements = processedSettlements.filter((settlement: any, index: number) => {
      // Check for required fields
      const missingFields = requiredFields.filter(field => {
        return settlement[field] === undefined || settlement[field] === null;
      });

      if (missingFields.length > 0) {
        errors.push(`Settlement #${index + 1}: Missing required fields: ${missingFields.join(', ')}`);
        return false;
      }

      // Validate numeric fields
      const numericFields = ['amount', 'initial_offer', 'policy_limit', 'medical_expenses'];
      for (const field of numericFields) {
        if (isNaN(Number(settlement[field]))) {
          errors.push(`Settlement #${index + 1}: Field "${field}" must be a number`);
          return false;
        }
      }

      // Set payment_completed to true for imported settlements
      settlement.payment_completed = true;
      
      return true;
    });

    // Process in chunks to avoid hitting any limits
    const chunkSize = 100;
    let importedCount = 0;

    for (let i = 0; i < validSettlements.length; i += chunkSize) {
      const chunk = validSettlements.slice(i, i + chunkSize);
      
      // Insert the chunk
      const { error } = await supabase
        .from('settlements')
        .insert(chunk);

      if (error) {
        console.error('Chunk insert error:', error);
        errors.push(`Error importing chunk ${i/chunkSize + 1}: ${error.message}`);
      } else {
        importedCount += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        imported: importedCount, 
        errors: errors.length > 0 ? errors : null,
        total: settlements.length,
        valid: validSettlements.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process settlements', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
