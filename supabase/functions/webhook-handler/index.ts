// Follow this setup guide to integrate the Deno runtime and your Supabase project:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno"; // Using newer Deno-compatible version

// Enhanced CORS headers - explicitly include 'stripe-signature'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log webhook request details for better debugging
    console.log(`Webhook request received from: ${req.headers.get('origin') || 'unknown origin'}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Host header: ${req.headers.get('host')}`);
    console.log(`User-Agent: ${req.headers.get('user-agent')}`);
    
    // Get environment variables
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
      console.error('Missing Stripe configuration. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set.');
      return new Response(
        JSON.stringify({ error: 'Missing Stripe configuration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in request headers');
      console.log('Available headers:', [...req.headers.keys()].join(', '));
      
      return new Response(
        JSON.stringify({ 
          error: 'No stripe-signature header found', 
          availableHeaders: [...req.headers.keys()],
          message: 'This webhook endpoint requires a valid Stripe signature',
          receivedAt: new Date().toISOString()
        }),
        { 
          status: 200, // Return 200 instead of 400 to avoid Stripe retries
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.text();
    
    // Log detailed debugging information
    console.log(`Webhook received with signature: ${signature.substring(0, 10)}...`);
    console.log(`Body preview: ${body.substring(0, 100)}...`);
    
    // Create Stripe client
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Successfully verified webhook signature');
    } catch (verificationError) {
      console.error('Webhook signature verification failed:', verificationError);
      return new Response(
        JSON.stringify({ 
          error: 'Webhook signature verification failed',
          details: verificationError.message,
          received: true
        }),
        { 
          status: 200, // Return 200 instead of 401 to avoid Stripe retries
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Process the webhook event with improved logging
    console.log(`Processing event type: ${event.type}, event ID: ${event.id}`);
    console.log(`Event received timestamp: ${new Date().toISOString()}`);
    
    // Add more specific logging for the event data
    if (event.data?.object?.metadata?.temporaryId) {
      console.log(`Event contains temporaryId: ${event.data.object.metadata.temporaryId}`);
    }
    
    // Handle different event types
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSession(event.data.object, supabase, stripe);
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      await handleInvoicePayment(event.data.object, supabase, stripe);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response to Stripe with detailed information
    return new Response(
      JSON.stringify({ 
        received: true, 
        success: true, 
        event_type: event.type,
        processed_at: new Date().toISOString(),
        event_id: event.id,
        message: "Webhook processed successfully"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook general error:', error);
    // Provide more detailed error information but return 200 to prevent Stripe from retrying
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
        received: true // Tell Stripe we received the webhook
      }),
      { 
        status: 200, // Always return 200 to Stripe
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Handle checkout.session.completed events
async function handleCheckoutSession(session: any, supabase: any, stripe: any) {
  try {
    console.log('Processing checkout.session.completed event');
    console.log('Session details:', {
      id: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
      metadata: session.metadata
    });
    
    // Extract important data from the session
    const temporaryId = session.metadata?.temporaryId;
    const userId = session.metadata?.userId;
    
    if (!temporaryId) {
      console.error('No temporaryId found in session metadata');
      return;
    }
    
    // First, check if this settlement has already been processed to avoid duplicates
    const { data: existingSettlement, error: checkError } = await supabase
      .from('settlements')
      .select('id, payment_completed, amount, attorney, firm, type, location')
      .eq('temporary_id', temporaryId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking settlement existence:', checkError);
      throw checkError;
    }
    
    if (!existingSettlement) {
      console.error(`No settlement found with temporaryId ${temporaryId}`);
      return;
    }
    
    console.log(`Found existing settlement with temporaryId ${temporaryId}:`, existingSettlement);
    
    // If the settlement is already marked as paid, no need to update
    if (existingSettlement.payment_completed) {
      console.log('Settlement already marked as paid, skipping update');
      return;
    }
    
    // Otherwise, update ONLY the payment fields of the existing settlement
    const { data: updatedSettlement, error: updateError } = await supabase
      .from('settlements')
      .update({
        payment_completed: true,
        user_id: userId || existingSettlement.user_id,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('temporary_id', temporaryId)
      .select()
      .single();
        
    if (updateError) {
      console.error('Error updating settlement payment status:', updateError);
      throw updateError;
    }
    
    console.log('Successfully updated settlement payment status:', updatedSettlement?.id);
    
    // Create or update subscription record
    try {
      const { data: existingSub, error: subCheckError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('temporary_id', temporaryId)
        .maybeSingle();
        
      if (subCheckError) {
        console.error('Error checking existing subscription:', subCheckError);
      }
      
      if (existingSub) {
        console.log(`Found existing subscription for temporaryId ${temporaryId}, updating`);
        
        const { error: subUpdateError } = await supabase
          .from('subscriptions')
          .update({
            user_id: userId || null,
            customer_id: session.customer,
            payment_id: session.id,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id);
          
        if (subUpdateError) {
          console.error('Error updating subscription:', subUpdateError);
        } else {
          console.log('Subscription updated successfully');
        }
      } else {
        console.log(`Creating new subscription for temporaryId ${temporaryId}`);
        
        const { error: subInsertError } = await supabase
          .from('subscriptions')
          .insert({
            temporary_id: temporaryId,
            user_id: userId,
            customer_id: session.customer,
            payment_id: session.id,
            is_active: true,
            starts_at: new Date().toISOString()
          });
          
        if (subInsertError) {
          console.error('Error creating subscription:', subInsertError);
        } else {
          console.log('Subscription created successfully');
        }
      }
    } catch (subError) {
      console.error('Error handling subscription:', subError);
    }
  } catch (error) {
    console.error('Error in handleCheckoutSession:', error);
    throw error;
  }
}

// Handle invoice payment events
async function handleInvoicePayment(invoice: any, supabase: any, stripe: any) {
  try {
    console.log(`Processing invoice payment event:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      status: invoice.status,
      amountPaid: invoice.amount_paid,
      total: invoice.total
    });
    
    // Skip if we don't have a subscription
    if (!invoice.subscription) {
      console.log('No subscription ID in invoice, skipping');
      return;
    }
    
    // Find related checkout session for this subscription
    try {
      const { data: checkoutSessions } = await stripe.checkout.sessions.list({
        subscription: invoice.subscription,
        limit: 5 // Get a few in case there are multiple
      });
      
      if (!checkoutSessions || checkoutSessions.data.length === 0) {
        console.log(`No checkout sessions found for subscription: ${invoice.subscription}`);
        return;
      }
      
      console.log(`Found ${checkoutSessions.data.length} checkout sessions for subscription ${invoice.subscription}`);
      
      // Process each session - usually there should be just one, but being thorough
      for (const session of checkoutSessions.data) {
        console.log(`Processing checkout session from invoice payment:`, {
          sessionId: session.id,
          temporaryId: session.metadata?.temporaryId,
          metadata: session.metadata
        });
        
        // Skip sessions without temporaryId
        if (!session.metadata?.temporaryId) {
          console.log(`Session ${session.id} has no temporaryId in metadata, skipping`);
          continue;
        }
        
        // Handle this session just like checkout.session.completed
        await handleCheckoutSession(session, supabase, stripe);
      }
      
      console.log('Finished processing invoice payment event');
    } catch (stripeError) {
      console.error('Error fetching checkout sessions:', stripeError);
    }
  } catch (error) {
    console.error('Error in handleInvoicePayment:', error);
  }
}
