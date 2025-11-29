import { useState, useEffect } from 'react';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const useMercadoPago = () => {
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

        // Gerar device_id único (não precisa do SDK para isso)
        // O Mercado Pago aceita um identificador único do dispositivo
        const fallbackId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setDeviceId(fallbackId);
        console.log('Device ID gerado:', fallbackId);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing MercadoPago:', err);
        // Mesmo com erro, criar um fallback device_id
        const fallbackId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setDeviceId(fallbackId);
        setError('Failed to initialize MercadoPago SDK');
        setIsLoading(false);
      }
    };

    initializeMercadoPago();
  }, []);

  return { deviceId, isLoading, error };
};
