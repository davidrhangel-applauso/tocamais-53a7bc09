-- Create secure function to get user emails for admin
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access emails
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;