CREATE POLICY "Anyone can view subscription prices"
ON public.admin_settings FOR SELECT
TO anon, authenticated
USING (setting_key LIKE 'subscription_price_%');