
-- Table to track funnel page views
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page TEXT NOT NULL,
  country TEXT,
  ip_address TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from anon (tracking), deny reads from anon
CREATE POLICY "Allow anon insert" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Deny anon select" ON public.page_views FOR SELECT USING (false);
CREATE POLICY "Deny anon update" ON public.page_views FOR UPDATE USING (false);
CREATE POLICY "Deny anon delete" ON public.page_views FOR DELETE USING (false);

-- Index for fast queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_page ON public.page_views (page);

-- Table to track completed orders/sales
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_intent_id TEXT UNIQUE,
  email TEXT,
  customer_name TEXT,
  package_id TEXT,
  package_name TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  country TEXT,
  city TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  status TEXT DEFAULT 'paid'
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Deny all public access (only service role from edge functions)
CREATE POLICY "Deny anon select orders" ON public.orders FOR SELECT USING (false);
CREATE POLICY "Deny anon insert orders" ON public.orders FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon update orders" ON public.orders FOR UPDATE USING (false);
CREATE POLICY "Deny anon delete orders" ON public.orders FOR DELETE USING (false);

-- Index for fast queries
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_country ON public.orders (country);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
