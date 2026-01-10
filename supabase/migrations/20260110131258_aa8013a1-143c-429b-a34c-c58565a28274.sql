-- Create RLS policies for payment_attempts table
-- This table is only accessed by edge functions using service role (which bypasses RLS)
-- So we deny all public access for security

-- Policy: Deny all SELECT access (service role bypasses RLS)
CREATE POLICY "Deny public read access" 
ON public.payment_attempts 
FOR SELECT 
USING (false);

-- Policy: Deny all INSERT access (service role bypasses RLS)
CREATE POLICY "Deny public insert access" 
ON public.payment_attempts 
FOR INSERT 
WITH CHECK (false);

-- Policy: Deny all UPDATE access
CREATE POLICY "Deny public update access" 
ON public.payment_attempts 
FOR UPDATE 
USING (false);

-- Policy: Deny all DELETE access
CREATE POLICY "Deny public delete access" 
ON public.payment_attempts 
FOR DELETE 
USING (false);