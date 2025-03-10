
-- Create a table to store and track Stripe sessions
CREATE TABLE IF NOT EXISTS public.stripe_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  temporary_id UUID NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_data JSONB
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_session_id ON public.stripe_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_temporary_id ON public.stripe_sessions(temporary_id);

-- Update settlements table to add Stripe-related fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'settlements' 
                 AND column_name = 'stripe_session_id') THEN
    ALTER TABLE public.settlements ADD COLUMN stripe_session_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'settlements' 
                 AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE public.settlements ADD COLUMN stripe_subscription_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'settlements' 
                 AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE public.settlements ADD COLUMN stripe_customer_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'settlements' 
                 AND column_name = 'paid_at') THEN
    ALTER TABLE public.settlements ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
