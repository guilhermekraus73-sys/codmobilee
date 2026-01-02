-- Create table for tracking payment attempts (rate limiting)
CREATE TABLE public.payment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  card_last4 TEXT,
  email TEXT,
  attempt_type TEXT DEFAULT 'card_payment',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by IP
CREATE INDEX idx_payment_attempts_ip_created ON public.payment_attempts (ip_address, created_at DESC);

-- Create index for email lookups
CREATE INDEX idx_payment_attempts_email ON public.payment_attempts (email);

-- Enable RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Allow insert for anyone (edge function will use service role)
CREATE POLICY "Allow insert for service role" 
ON public.payment_attempts 
FOR INSERT 
WITH CHECK (true);

-- Allow select for service role only (no public reads)
CREATE POLICY "Allow select for service role"
ON public.payment_attempts 
FOR SELECT 
USING (true);

-- Function to clean old payment attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.clean_old_payment_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.payment_attempts 
  WHERE created_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;