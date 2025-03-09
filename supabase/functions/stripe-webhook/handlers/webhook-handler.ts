
import { handleCheckoutSession } from "./checkout-handler.ts";
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from "./subscription-handler.ts";

// Process different webhook event types
export const handleWebhookEvent = async (event: any, supabase: any) => {
  console.log(`Processing event type: ${event.type}`);
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSession(event.data.object, supabase, event.livemode);
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
