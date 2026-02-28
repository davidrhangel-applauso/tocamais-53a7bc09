import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  valor: number;
}

interface UseSubscriptionReturn {
  isLoading: boolean;
  isPro: boolean;
  subscription: Subscription | null;
  daysRemaining: number | null;
  refetch: () => Promise<void>;
}

export function useSubscription(artistaId: string | null): UseSubscriptionReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!artistaId) {
      setIsLoading(false);
      return;
    }

    try {
      // First check Stripe via edge function
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');

      if (!stripeError && stripeData) {
        if (stripeData.subscribed) {
          setIsPro(true);
          if (stripeData.subscription_end) {
            const endsAt = new Date(stripeData.subscription_end);
            const now = new Date();
            const diffTime = endsAt.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays > 0 ? diffDays : 0);
          } else {
            // Admin-granted or permanent
            setDaysRemaining(null);
          }
          setIsLoading(false);
          return;
        }
      }

      // Fallback: check local DB (admin-granted PRO)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano')
        .eq('id', artistaId)
        .single();

      const { data: sub } = await supabase
        .from('artist_subscriptions')
        .select('*')
        .eq('artista_id', artistaId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const isProfilePro = profile?.plano === 'pro';

      if (sub && sub.ends_at) {
        const endsAt = new Date(sub.ends_at);
        const now = new Date();
        const diffTime = endsAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays > 0 ? diffDays : 0);
        setSubscription(sub);
        setIsPro(isProfilePro && diffDays > 0);
      } else if (isProfilePro) {
        setSubscription(sub || null);
        setDaysRemaining(null);
        setIsPro(true);
      } else {
        setSubscription(null);
        setDaysRemaining(null);
        setIsPro(false);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setIsPro(false);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [artistaId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    isLoading,
    isPro,
    subscription,
    daysRemaining,
    refetch: fetchSubscription,
  };
}
