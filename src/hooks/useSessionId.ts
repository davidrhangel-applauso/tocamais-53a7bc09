import { useEffect, useState } from 'react';

/**
 * Gera um session_id criptograficamente seguro
 * Usa crypto.getRandomValues() que é resistente a ataques de força bruta
 */
const generateSecureSessionId = (): string => {
  const array = new Uint8Array(32); // 256 bits de entropia
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Valida formato do session_id (64 caracteres hexadecimais)
 */
const isValidSessionId = (sessionId: string): boolean => {
  return /^[a-f0-9]{64}$/.test(sessionId);
};

/**
 * Hook para gerenciar session_id para usuários anônimos
 * Gera um ID criptograficamente seguro que persiste durante a sessão do navegador
 */
export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Tentar obter session_id existente do sessionStorage
    let storedSessionId = sessionStorage.getItem('anonymous_session_id');
    
    // Verificar se o session_id existente é válido (pode ser formato antigo)
    if (!storedSessionId || !isValidSessionId(storedSessionId)) {
      // Gerar novo session_id criptograficamente seguro
      storedSessionId = generateSecureSessionId();
      sessionStorage.setItem('anonymous_session_id', storedSessionId);
    }
    
    setSessionId(storedSessionId);
  }, []);

  return sessionId;
};
