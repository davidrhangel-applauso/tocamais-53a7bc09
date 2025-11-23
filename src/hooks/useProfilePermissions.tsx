import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfilePermissions {
  canViewSensitiveData: boolean;
  loading: boolean;
}

/**
 * Hook to check if the current user has permission to view sensitive profile data
 * Sensitive data includes: link_pix, instagram, youtube, spotify, cidade, bio
 */
export const useProfilePermissions = (profileId: string | undefined): ProfilePermissions => {
  const [canViewSensitiveData, setCanViewSensitiveData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!profileId) {
        setCanViewSensitiveData(false);
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setCanViewSensitiveData(false);
          setLoading(false);
          return;
        }

        // User can always see their own sensitive data
        if (user.id === profileId) {
          setCanViewSensitiveData(true);
          setLoading(false);
          return;
        }

        // Check if user has interacted with this profile using the database function
        const { data, error } = await supabase.rpc('can_view_full_profile', {
          profile_id: profileId
        });

        if (error) {
          console.error('Error checking profile permissions:', error);
          setCanViewSensitiveData(false);
        } else {
          setCanViewSensitiveData(data || false);
        }
      } catch (error) {
        console.error('Error in checkPermissions:', error);
        setCanViewSensitiveData(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [profileId]);

  return { canViewSensitiveData, loading };
};
