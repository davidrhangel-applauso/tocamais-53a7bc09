import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  tipo: "artista" | "cliente" | "estabelecimento";
}

/**
 * Waits for a user profile to be created in the database.
 * Uses retry logic to handle the async trigger that creates profiles.
 */
export const waitForProfile = async (
  userId: string, 
  maxAttempts: number = 10,
  delayMs: number = 500
): Promise<Profile | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data: profile, error, status } = await supabase
        .from("profiles")
        .select("id, tipo")
        .eq("id", userId)
        .maybeSingle();
      
      console.log(`[waitForProfile] Attempt ${attempt + 1}: status=${status}, profile=`, profile, 'error=', error);

      if (profile) {
        return profile;
      }

      if (error) {
        console.error(`[waitForProfile] Error on attempt ${attempt + 1}:`, error);
      }
    } catch (e) {
      console.error(`[waitForProfile] Exception on attempt ${attempt + 1}:`, e);
    }
    
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.error(`[waitForProfile] Profile not found after ${maxAttempts} attempts for user ${userId}`);
  return null;
};
