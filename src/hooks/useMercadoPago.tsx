import { useState, useEffect } from 'react';
import { MERCADO_PAGO_CONFIG } from '@/config/mercadopago';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const useMercadoPago = () => {
  const [mp, setMp] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMercadoPago = async () => {
      try {
        // Aguardar o SDK carregar
        if (typeof window.MercadoPago === 'undefined') {
          let attempts = 0;
          const maxAttempts = 50; // 5 segundos (100ms * 50)
          
          await new Promise<void>((resolve, reject) => {
            const checkSDK = setInterval(() => {
              attempts++;
              if (typeof window.MercadoPago !== 'undefined') {
                clearInterval(checkSDK);
                resolve();
              } else if (attempts >= maxAttempts) {
                clearInterval(checkSDK);
                reject(new Error('MercadoPago SDK failed to load'));
              }
            }, 100);
          });
        }

        // Inicializar SDK V2 com Public Key
        const mpInstance = new window.MercadoPago(MERCADO_PAGO_CONFIG.publicKey, {
          locale: 'pt-BR'
        });
        
        setMp(mpInstance);
        console.log('MercadoPago SDK V2 inicializado com sucesso');
        
        // Tentar obter device_id do SDK (método pode variar conforme versão)
        let deviceIdValue: string;
        if (typeof mpInstance.getDeviceId === 'function') {
          deviceIdValue = mpInstance.getDeviceId();
        } else {
          // Fallback: gerar device_id único
          deviceIdValue = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        setDeviceId(deviceIdValue);
        console.log('Device ID:', deviceIdValue);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing MercadoPago:', err);
        const fallbackId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setDeviceId(fallbackId);
        setError('Failed to initialize MercadoPago SDK');
        setIsLoading(false);
      }
    };

    initializeMercadoPago();
  }, []);

  return { mp, deviceId, isLoading, error };
};
