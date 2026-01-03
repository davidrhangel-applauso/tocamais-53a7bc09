import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the cutoff date (90 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffDateStr = cutoffDate.toISOString();

    console.log(`[cleanup-archived-pedidos] Starting cleanup for pedidos archived before ${cutoffDateStr}`);

    // Delete archived pedidos older than 90 days
    const { data: deletedPedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .delete()
      .eq('arquivado', true)
      .lt('arquivado_at', cutoffDateStr)
      .select('id');

    if (pedidosError) {
      console.error('[cleanup-archived-pedidos] Error deleting pedidos:', pedidosError);
      throw pedidosError;
    }

    const deletedCount = deletedPedidos?.length || 0;
    console.log(`[cleanup-archived-pedidos] Successfully deleted ${deletedCount} archived pedidos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedCount,
        cutoff_date: cutoffDateStr
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cleanup-archived-pedidos] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});