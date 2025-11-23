import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  tipo: "artista" | "cliente";
}

/**
 * Waits for a user profile to be created in the database.
 * Uses retry logic to handle the async trigger that creates profiles.
 * 
 * @param userId - The user ID to check for
 * @param maxAttempts - Maximum number of retry attempts (default: 10)
 * @param delayMs - Delay between attempts in milliseconds (default: 500)
 * @returns The profile data if found, null if not found after all attempts
 */
export const waitForProfile = async (
  userId: string, 
  maxAttempts: number = 10,
  delayMs: number = 500
): Promise<Profile | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, tipo")
      .eq("id", userId)
      .maybeSingle();
    
    if (profile) {
      console.log(`Profile found on attempt ${attempt + 1}`);
      return profile;
    }

    if (error) {
      console.error(`Error checking profile on attempt ${attempt + 1}:`, error);
    }
    
    // Wait before next attempt (unless it's the last attempt)
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.error(`Profile not found after ${maxAttempts} attempts`);
  return null;
};
