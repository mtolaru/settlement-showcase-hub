
import { handleCheckoutSession } from "./checkout-handler.ts";
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from "./subscription-handler.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

// Process different webhook event types
export const handleWebhookEvent = async (event: any, supabase: any) => {
  console.log(`Processing event type: ${event.type}`);
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSession(event.data.object, supabase, event.livemode);
      break;
      
    case 'invoice.paid':
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(event.data.object, supabase, event.livemode);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object, supabase);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object, supabase);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

// Handle invoice payment events
const handleInvoicePayment = async (invoice: any, supabase: any, isLiveMode: boolean) => {
  try {
    console.log(`Processing invoice payment event:`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      isLiveMode,
      status: invoice.status,
      amountPaid: invoice.amount_paid,
      total: invoice.total
    });
    
    // Skip if we don't have a subscription
    if (!invoice.subscription) {
      console.log('No subscription ID in invoice, skipping');
      return;
    }
    
    // Get the Stripe secret key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('Missing Stripe configuration. STRIPE_SECRET_KEY must be set.');
      return;
    }
    
    // Create Stripe client
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    // Find related checkout session for this subscription
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
      await handleCheckoutSession(session, supabase, isLiveMode);
    }
    
    console.log('Finished processing invoice payment event');
  } catch (error) {
    console.error('Error in handleInvoicePayment:', error);
  }
};
