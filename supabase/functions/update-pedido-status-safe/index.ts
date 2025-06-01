
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { pedido_id, vendedor_id, new_status, order_id_to_update } = await req.json()

    console.log('🔄 Updating pedido status safely:', { pedido_id, vendedor_id, new_status, order_id_to_update })

    // Step 1: Update pedidos table first
    console.log('📝 Updating pedidos table...')
    const { error: pedidosError } = await supabaseClient
      .from('pedidos')
      .update({ status: new_status })
      .eq('id', pedido_id)
      .eq('vendedor_id', vendedor_id)

    if (pedidosError) {
      console.error('❌ Error updating pedidos table:', pedidosError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to update pedidos: ${pedidosError.message}`,
          details: pedidosError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    console.log('✅ Pedidos table updated successfully')

    // Step 2: Update orders table if order_id exists
    if (order_id_to_update) {
      console.log('📝 Updating orders table...')
      const { error: ordersError } = await supabaseClient
        .from('orders')
        .update({ status: new_status })
        .eq('id', order_id_to_update)

      if (ordersError) {
        console.warn('⚠️ Warning updating orders table:', ordersError)
        // Don't fail the entire operation if orders update fails
        // The pedidos table is the primary source of truth
        console.log('ℹ️ Continuing with success, pedidos table updated')
      } else {
        console.log('✅ Orders table updated successfully')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Status updated to ${new_status}`,
        pedido_id,
        new_status 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in update-pedido-status-safe:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        details: error.stack || 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
