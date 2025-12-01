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
  
  // Public Key para inicializar o SDK V2
  // NOTA: Esta é a chave de TESTE. Para produção, trocar por APP_USR-xxx
  publicKey: "TEST-df74a07d-9d95-4161-8b28-978cfe079f89",
  
  // URL de redirecionamento após OAuth (configurado no Mercado Pago)
  redirectUri: "https://tnhbijlskoffgoocftfq.supabase.co/functions/v1/mercadopago-oauth-callback",
};
