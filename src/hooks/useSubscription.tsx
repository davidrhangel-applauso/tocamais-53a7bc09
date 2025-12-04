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
      // Buscar plano do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano')
        .eq('id', artistaId)
        .single();

      // Buscar assinatura ativa
      const { data: sub } = await supabase
        .from('artist_subscriptions')
        .select('*')
        .eq('artista_id', artistaId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sub && sub.ends_at) {
        const endsAt = new Date(sub.ends_at);
        const now = new Date();
        const diffTime = endsAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysRemaining(diffDays > 0 ? diffDays : 0);
        setSubscription(sub);
        setIsPro(profile?.plano === 'pro' && diffDays > 0);
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
