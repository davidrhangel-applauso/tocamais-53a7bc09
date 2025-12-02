import { useEffect, useState } from 'react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { MERCADO_PAGO_CONFIG } from '@/config/mercadopago';

export const useMercadoPago = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('Inicializando Mercado Pago SDK React...');
      initMercadoPago(MERCADO_PAGO_CONFIG.publicKey, {
        locale: 'pt-BR',
      });
      setIsInitialized(true);
      console.log('Mercado Pago SDK React inicializado com sucesso');
    } catch (err) {
      console.error('Erro ao inicializar Mercado Pago:', err);
      setError('Erro ao inicializar Mercado Pago');
    }
  }, []);

  return { 
    isInitialized, 
    error,
    // Mantém compatibilidade com código existente
    mp: null,
    deviceId: null,
    isLoading: !isInitialized,
  };
};
