
-- Add subscription_status column to settlements table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'settlements' 
                 AND column_name = 'subscription_status') THEN
    ALTER TABLE public.settlements ADD COLUMN subscription_status TEXT;
  END IF;

  -- Add updated_at column to subscriptions table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'subscriptions' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;

  -- Add updated_at column to stripe_sessions table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'stripe_sessions' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.stripe_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;

  -- Add updated_at column to settlement_users table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'settlement_users' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.settlement_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;
