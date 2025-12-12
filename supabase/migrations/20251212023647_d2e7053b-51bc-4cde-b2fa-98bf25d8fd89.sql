-- Add explicit policy to deny anonymous access to artist_pix_info
-- This adds a belt-and-suspenders approach to ensure unauthenticated users cannot access PIX data

CREATE POLICY "Deny anonymous access to PIX info"
ON public.artist_pix_info
FOR SELECT
TO anon
USING (false);