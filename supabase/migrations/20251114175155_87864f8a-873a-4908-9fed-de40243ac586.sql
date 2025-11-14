-- Force regeneration of types.ts file
-- This migration adds a simple comment to trigger the types generation
COMMENT ON TABLE profiles IS 'User profiles with artist and client information';