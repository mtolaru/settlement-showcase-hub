
// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get and validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Create clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const { sessionId, temporaryId } = await req.json();
    
    console.log('Attempting to fix settlement for:', { sessionId, temporaryId });
    
    if (!sessionId && !temporaryId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: need either sessionId or temporaryId'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // RECOVERY APPROACH #1: Check if we have a tracked session
    if (sessionId) {
      const { data: sessionData } = await supabase
        .from('stripe_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
        
      if (sessionData) {
        console.log('Found session record:', sessionData);
        
        // Get the temporary ID
        const tempId = sessionData.temporary_id;
        
        // Check if we have a settlement
        const { data: settlement, error: settlementError } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', tempId)
          .maybeSingle();
          
        if (settlementError) {
          console.error('Error finding settlement:', settlementError);
        }
        
        if (settlement) {
          console.log('Found settlement:', settlement.id);
          
          // If payment not marked complete, update it
          if (!settlement.payment_completed) {
            const { error: updateError } = await supabase
              .from('settlements')
              .update({
                payment_completed: true,
                stripe_session_id: sessionId,
                paid_at: new Date().toISOString()
              })
              .eq('id', settlement.id);
              
            if (updateError) {
              console.error('Error updating settlement:', updateError);
            } else {
              console.log('Updated payment status for settlement:', settlement.id);
            }
          }
          
          // Make sure we have a subscription record
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('payment_id', sessionId)
            .maybeSingle();
            
          if (!subscription) {
            // Create a subscription record
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: sessionData.user_id || null,
                temporary_id: tempId,
                payment_id: sessionId,
                is_active: true,
                created_at: new Date().toISOString(),
                starts_at: new Date().toISOString()
              });
              
            if (subError) {
              console.error('Error creating subscription:', subError);
            } else {
              console.log('Created missing subscription record');
            }
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Settlement found and payment status updated',
              temporaryId: tempId
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
      }
    }
    
    // RECOVERY APPROACH #2: Check Stripe directly if we have a session ID
    if (sessionId) {
      try {
        console.log('Checking Stripe directly for session:', sessionId);
        
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session) {
          console.log('Found session in Stripe:', {
            id: session.id,
            payment_status: session.payment_status,
            status: session.status,
            metadata: session.metadata
          });
          
          const sessionTempId = session.metadata?.temporaryId;
          const userId = session.metadata?.userId;
          
          // If we have a temporaryId in the session metadata, use it
          if (sessionTempId) {
            console.log('Using temporaryId from session metadata:', sessionTempId);
            
            // Check if we have a settlement
            const { data: settlement } = await supabase
              .from('settlements')
              .select('*')
              .eq('temporary_id', sessionTempId)
              .maybeSingle();
              
            if (settlement) {
              console.log('Found settlement by session temporaryId:', settlement.id);
              
              // Update payment status if needed
              if (!settlement.payment_completed) {
                const { error: updateError } = await supabase
                  .from('settlements')
                  .update({
                    payment_completed: true,
                    stripe_session_id: sessionId,
                    paid_at: new Date().toISOString()
                  })
                  .eq('id', settlement.id);
                  
                if (updateError) {
                  console.error('Error updating settlement:', updateError);
                } else {
                  console.log('Updated payment status for settlement:', settlement.id);
                }
              }
              
              // Ensure we have a subscription record
              const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('payment_id', sessionId)
                .maybeSingle();
                
              if (!subscription) {
                // Create a subscription record
                const { error: subError } = await supabase
                  .from('subscriptions')
                  .insert({
                    user_id: userId || null,
                    temporary_id: sessionTempId,
                    payment_id: sessionId,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    starts_at: new Date().toISOString()
                  });
                  
                if (subError) {
                  console.error('Error creating subscription:', subError);
                } else {
                  console.log('Created missing subscription record');
                }
              }
              
              return new Response(
                JSON.stringify({
                  success: true,
                  message: 'Settlement found and payment status updated from Stripe data',
                  temporaryId: sessionTempId
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200
                }
              );
            }
          }
        }
      } catch (stripeError) {
        console.error('Error retrieving Stripe session:', stripeError);
      }
    }
    
    // RECOVERY APPROACH #3: Try to find a settlement by temporaryId
    if (temporaryId) {
      console.log('Checking for settlement by temporaryId:', temporaryId);
      
      const { data: settlement } = await supabase
        .from('settlements')
        .select('*')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      if (settlement) {
        console.log('Found settlement by temporaryId:', settlement.id);
        
        // Update payment status if needed
        if (!settlement.payment_completed) {
          const { error: updateError } = await supabase
            .from('settlements')
            .update({
              payment_completed: true,
              paid_at: new Date().toISOString()
            })
            .eq('id', settlement.id);
            
          if (updateError) {
            console.error('Error updating settlement:', updateError);
          } else {
            console.log('Updated payment status for settlement:', settlement.id);
          }
        }
        
        // Ensure we have a subscription record
        if (sessionId) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('temporary_id', temporaryId)
            .maybeSingle();
            
          if (!subscription) {
            // Create a subscription record
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                temporary_id: temporaryId,
                payment_id: sessionId,
                is_active: true,
                created_at: new Date().toISOString(),
                starts_at: new Date().toISOString()
              });
              
            if (subError) {
              console.error('Error creating subscription:', subError);
            } else {
              console.log('Created missing subscription record');
            }
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Settlement found and payment status updated',
            settlement: settlement.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }
    
    // RECOVERY APPROACH #4: Last resort - check recent submissions
    console.log('Attempting last resort recovery - checking recent submissions');
    
    const { data: recentSettlements } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (recentSettlements && recentSettlements.length > 0) {
      console.log('Found recent settlements:', recentSettlements.length);
      
      // Try to match by session ID if available
      if (sessionId) {
        const matchingSettlement = recentSettlements.find(s => 
          s.stripe_session_id === sessionId
        );
        
        if (matchingSettlement) {
          console.log('Found settlement matching session ID:', matchingSettlement.id);
          
          if (!matchingSettlement.payment_completed) {
            const { error: updateError } = await supabase
              .from('settlements')
              .update({
                payment_completed: true,
                paid_at: new Date().toISOString()
              })
              .eq('id', matchingSettlement.id);
              
            if (updateError) {
              console.error('Error updating settlement:', updateError);
            } else {
              console.log('Updated payment status for settlement:', matchingSettlement.id);
            }
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Found settlement by session ID in recent submissions',
              settlement: matchingSettlement.id,
              temporaryId: matchingSettlement.temporary_id
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
      }
      
      // If no match and we're really desperate, just use the most recent one
      const mostRecent = recentSettlements[0];
      console.log('Using most recent settlement as last resort:', mostRecent.id);
      
      if (!mostRecent.payment_completed) {
        const { error: updateError } = await supabase
          .from('settlements')
          .update({
            payment_completed: true,
            stripe_session_id: sessionId || null,
            paid_at: new Date().toISOString()
          })
          .eq('id', mostRecent.id);
          
        if (updateError) {
          console.error('Error updating settlement:', updateError);
        } else {
          console.log('Updated payment status for settlement:', mostRecent.id);
        }
      }
      
      // Create a subscription record if needed
      if (sessionId) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('payment_id', sessionId)
          .maybeSingle();
          
        if (!subscription) {
          const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
              temporary_id: mostRecent.temporary_id,
              payment_id: sessionId,
              is_active: true,
              created_at: new Date().toISOString(),
              starts_at: new Date().toISOString()
            });
            
          if (subError) {
            console.error('Error creating subscription:', subError);
          } else {
            console.log('Created missing subscription record');
          }
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Using most recent settlement as last resort',
          settlement: mostRecent.id,
          temporaryId: mostRecent.temporary_id,
          isLastResort: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // We've tried everything and failed
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Could not find or fix any settlement',
        attempted: {
          sessionId,
          temporaryId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      }
    );
    
  } catch (error) {
    console.error('General error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
