CREATE POLICY "Anyone can view stripe price ids"
ON public.admin_settings FOR SELECT
TO anon, authenticated
USING (setting_key LIKE 'stripe_price_id_%');