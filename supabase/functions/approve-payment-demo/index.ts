import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gorjeta_id } = await req.json();

    if (!gorjeta_id) {
      throw new Error('gorjeta_id é obrigatório');
    }

    console.log('Approving payment demo for gorjeta:', gorjeta_id);

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar gorjeta
    const { data: gorjeta, error: findError } = await supabase
      .from('gorjetas')
      .select('*')
      .eq('id', gorjeta_id)
      .single();

    if (findError || !gorjeta) {
      throw new Error('Gorjeta não encontrada');
    }

    // Atualizar status para aprovado (apenas para testes)
    const { error: updateError } = await supabase
      .from('gorjetas')
      .update({ status_pagamento: 'approved' })
      .eq('id', gorjeta_id);

    if (updateError) {
      throw new Error('Erro ao atualizar status: ' + updateError.message);
    }

    console.log('Payment approved successfully in demo mode');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pagamento aprovado em modo de teste',
        status: 'approved',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in approve-payment-demo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
