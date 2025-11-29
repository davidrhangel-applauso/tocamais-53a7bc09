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

        // Inicializar MercadoPago sem public key (para obter device_id apenas)
        const mp = new window.MercadoPago();
        
        // Obter device_id
        const id = await mp.getIdentificationTypes();
        
        // O device_id é gerado automaticamente pelo SDK
        // Podemos acessá-lo através do sessionId
        const sessionId = mp.deviceProfile?.getDevice();
        
        if (sessionId) {
          setDeviceId(sessionId);
        } else {
          // Fallback: gerar um ID único baseado em timestamp e random
          const fallbackId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setDeviceId(fallbackId);
          console.warn('MercadoPago device_id not available, using fallback');
        }
        
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
