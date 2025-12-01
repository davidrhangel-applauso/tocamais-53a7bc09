/**
 * Configurações do Mercado Pago
 * 
 * IMPORTANTE: O Client ID é uma identificação pública da aplicação
 * e é seguro expô-lo no frontend. Ele é usado apenas para iniciar
 * o fluxo OAuth. O Client Secret (sensível) permanece protegido
 * nos Secrets do Cloud.
 */

export const MERCADO_PAGO_CONFIG = {
  clientId: "8365357642150667",
  
  // Public Key para inicializar o SDK V2 (PRODUÇÃO)
  publicKey: "APP_USR-6031ba0b-92a6-499d-b040-ba5037dfc8a6",
  
  // URL de redirecionamento após OAuth (configurado no Mercado Pago)
  redirectUri: "https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback",
};
