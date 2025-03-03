import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('Webhook Error: No Stripe signature found');
    return new Response(JSON.stringify({ error: 'No signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await req.text();
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret || '');
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Received event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object;
        console.log('Checkout session completed:', checkoutSession.id);
        
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
          checkoutSession.id,
          { expand: ['line_items'] }
        );
        console.log('Retrieved session with line items:', sessionWithLineItems.id);
        
        await handleCheckoutSessionCompleted(sessionWithLineItems);
        break;
        
      case 'customer.subscription.created':
        const createdSubscription = event.data.object;
        console.log('Subscription created:', createdSubscription.id);
        
        await handleSubscriptionCreated(createdSubscription);
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('Subscription updated:', updatedSubscription.id);
        
        await handleSubscriptionUpdated(updatedSubscription);
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('Subscription deleted:', deletedSubscription.id);
        
        await handleSubscriptionDeleted(deletedSubscription);
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        
        if (invoice.subscription) {
          await handleInvoicePaymentSucceeded(invoice);
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        
        if (failedInvoice.subscription) {
          await handleInvoicePaymentFailed(failedInvoice);
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout session:', session.id);
    if (!session.customer || !session.subscription) {
      console.log('No customer or subscription in session');
      return;
    }
    
    const customer = session.customer;
    const subscription = session.subscription;
    const paymentStatus = session.payment_status;
    
    console.log(`Customer: ${customer}, Subscription: ${subscription}, Payment Status: ${paymentStatus}`);
    
    if (paymentStatus !== 'paid') {
      console.log('Payment not completed, skipping subscription creation');
      return;
    }
    
    const subscriptionDetails = await stripe.subscriptions.retrieve(subscription);
    
    console.log('Retrieved subscription details:', subscriptionDetails.id);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const currentPeriodEnd = subscriptionDetails.current_period_end 
      ? new Date(subscriptionDetails.current_period_end * 1000).toISOString() 
      : null;

    let updateData = {
      is_active: subscriptionDetails.status === 'active',
      ends_at: currentPeriodEnd
    };

    if (subscriptionDetails.cancel_at_period_end && subscriptionDetails.status === 'active') {
      console.log('Subscription is set to cancel at period end:', subscriptionDetails.id);
      updateData = {
        is_active: true,
        ends_at: currentPeriodEnd
      };
    }
    
    const { data: subscriptions, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customer);
      
    if (findError) {
      console.error('Error finding subscriptions for customer:', findError);
      return;
    }
    
    if (subscriptions && subscriptions.length > 0) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptions[0].id);
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return;
      }
      
      console.log('Updated existing subscription:', subscriptions[0].id);
    } else {
      const { data: tempSubs, error: tempFindError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('temporary_id', session.client_reference_id);
        
      if (tempFindError) {
        console.error('Error finding temporary subscription:', tempFindError);
        return;
      }
      
      if (tempSubs && tempSubs.length > 0) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            ...updateData,
            customer_id: customer,
            payment_id: subscription
          })
          .eq('id', tempSubs[0].id);
          
        if (updateError) {
          console.error('Error updating temporary subscription:', updateError);
          return;
        }
        
        console.log('Updated temporary subscription with Stripe data:', tempSubs[0].id);
      } else {
        console.log('Creating new subscription record');
        
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([
            {
              payment_id: subscription,
              customer_id: customer,
              is_active: subscriptionDetails.status === 'active',
              starts_at: new Date().toISOString(),
              ends_at: currentPeriodEnd
            }
          ]);
          
        if (insertError) {
          console.error('Error creating subscription:', insertError);
          return;
        }
        
        console.log('Created new subscription record');
      }
    }
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Processing new subscription:', subscription.id);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: existingSubs, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_id', subscription.id);
      
    if (findError) {
      console.error('Error finding existing subscription:', findError);
      return;
    }
    
    if (existingSubs && existingSubs.length > 0) {
      console.log('Subscription already exists in database, skipping creation');
      return;
    }
    
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert([
        {
          payment_id: subscription.id,
          customer_id: subscription.customer,
          is_active: subscription.status === 'active',
          starts_at: new Date(subscription.start_date * 1000).toISOString(),
          ends_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
        }
      ]);
      
    if (insertError) {
      console.error('Error creating subscription:', insertError);
      return;
    }
    
    console.log('Created new subscription record for:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: subscriptionData, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_id', subscription.id)
      .maybeSingle();
      
    if (findError) {
      console.error('Error finding subscription:', findError);
      return;
    }
    
    if (!subscriptionData) {
      console.log('Subscription not found in database:', subscription.id);
      return;
    }
    
    const updateData = {
      is_active: subscription.status === 'active',
      ends_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
    };
    
    if (subscription.cancel_at_period_end && subscription.status === 'active') {
      console.log('Subscription set to cancel at period end:', subscription.id);
      updateData.is_active = true;
      updateData.ends_at = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null;
    }
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionData.id);
      
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }
    
    console.log('Updated subscription:', subscriptionData.id);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processing subscription deletion:', subscription.id);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: subscriptionData, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_id', subscription.id)
      .maybeSingle();
      
    if (findError) {
      console.error('Error finding subscription:', findError);
      return;
    }
    
    if (!subscriptionData) {
      console.log('Subscription not found in database:', subscription.id);
      return;
    }
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        is_active: false,
        ends_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.id);
      
    if (updateError) {
      console.error('Error marking subscription as inactive:', updateError);
      return;
    }
    
    console.log('Marked subscription as inactive:', subscriptionData.id);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('Processing invoice payment success:', invoice.id);
    
    if (invoice.subscription) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: subscriptionData, error: findError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('payment_id', invoice.subscription)
        .maybeSingle();
        
      if (findError) {
        console.error('Error finding subscription for invoice:', findError);
        return;
      }
      
      if (!subscriptionData) {
        console.log('Subscription not found in database for invoice:', invoice.subscription);
        return;
      }
      
      const subscriptionDetails = await stripe.subscriptions.retrieve(invoice.subscription);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          is_active: subscriptionDetails.status === 'active',
          ends_at: subscriptionDetails.current_period_end 
            ? new Date(subscriptionDetails.current_period_end * 1000).toISOString() 
            : null
        })
        .eq('id', subscriptionData.id);
        
      if (updateError) {
        console.error('Error updating subscription after payment:', updateError);
        return;
      }
      
      console.log('Updated subscription after payment:', subscriptionData.id);
    }
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('Processing invoice payment failure:', invoice.id);
    
    if (invoice.subscription) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: subscriptionData, error: findError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('payment_id', invoice.subscription)
        .maybeSingle();
        
      if (findError) {
        console.error('Error finding subscription for failed invoice:', findError);
        return;
      }
      
      if (!subscriptionData) {
        console.log('Subscription not found in database for failed invoice:', invoice.subscription);
        return;
      }
      
      console.log('Payment failed for subscription:', subscriptionData.id);
    }
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}
