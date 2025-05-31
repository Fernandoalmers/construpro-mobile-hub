
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

    // Begin transaction
    const { data: beginResult, error: beginError } = await supabaseClient.rpc('begin_transaction')
    if (beginError) throw beginError

    try {
      // Update orders table first if order_id exists
      if (order_id_to_update) {
        const { error: ordersError } = await supabaseClient
          .from('orders')
          .update({ status: new_status })
          .eq('id', order_id_to_update)

        if (ordersError) {
          console.error('Error updating orders table:', ordersError)
          throw ordersError
        }
        console.log('✅ Orders table updated')
      }

      // Update pedidos table with explicit session configuration to handle triggers
      const { error: pedidosError } = await supabaseClient
        .from('pedidos')
        .update({ status: new_status })
        .eq('id', pedido_id)
        .eq('vendedor_id', vendedor_id)

      if (pedidosError) {
        console.error('Error updating pedidos table:', pedidosError)
        throw pedidosError
      }
      console.log('✅ Pedidos table updated')

      // Commit transaction
      const { error: commitError } = await supabaseClient.rpc('commit_transaction')
      if (commitError) throw commitError

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
      // Rollback on error
      console.error('Transaction error, rolling back:', error)
      await supabaseClient.rpc('rollback_transaction').catch(console.error)
      throw error
    }

  } catch (error) {
    console.error('Error in update-pedido-status-safe:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.details || 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
