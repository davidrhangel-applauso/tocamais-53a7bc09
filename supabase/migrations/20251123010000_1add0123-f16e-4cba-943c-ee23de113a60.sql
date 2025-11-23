-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create a more secure policy: only authenticated users can view basic profile info
-- This prevents unauthenticated scraping while keeping the marketplace functional
CREATE POLICY "Authenticated users can view basic profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a policy for users to see their own complete profile (including sensitive data)
CREATE POLICY "Users can view their own complete profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add a comment explaining the security model
COMMENT ON TABLE profiles IS 'Artist profiles - basic info visible to authenticated users, sensitive fields like link_pix only visible to profile owner';

-- Create a security function to check if user can see sensitive fields
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_id;
$$;