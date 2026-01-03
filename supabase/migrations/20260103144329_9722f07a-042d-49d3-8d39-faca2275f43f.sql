-- Allow artists to insert gorjetas when confirming PIX payments
CREATE POLICY "Artists can insert gorjetas for confirmed PIX"
ON public.gorjetas
FOR INSERT
WITH CHECK (auth.uid() = artista_id AND status_pagamento = 'approved');