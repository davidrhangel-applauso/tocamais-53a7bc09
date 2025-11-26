import { useEffect, useState } from 'react';

/**
 * Hook para gerenciar session_id para usuários anônimos
 * Gera um ID único que persiste durante a sessão do navegador
 */
export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Tentar obter session_id existente do sessionStorage
    let storedSessionId = sessionStorage.getItem('anonymous_session_id');
    
    if (!storedSessionId) {
      // Gerar novo session_id único
      storedSessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('anonymous_session_id', storedSessionId);
    }
    
    setSessionId(storedSessionId);
  }, []);

  return sessionId;
};
