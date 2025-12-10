-- Add cover photo field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN foto_capa_url TEXT DEFAULT NULL;