import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderData } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Processing order:', orderData.id)

    // Get customer referral code processing (if any)
    try {
      console.log(`Processing referral activation for customer: ${orderData.cliente_id}`)
      
      // Call the referral processing function to activate any pending referrals
      const referralResponse = await fetch(`${supabaseUrl}/functions/v1/referral-processing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          action: 'activate_referral_on_purchase',
          user_id: orderData.cliente_id
        })
      })
      
      if (referralResponse.ok) {
        const referralResult = await referralResponse.json()
        console.log('Referral processing result:', referralResult.message)
      } else {
        console.error('Referral processing failed:', await referralResponse.text())
      }
    } catch (referralError) {
      console.error('Error processing referral activation:', referralError)
      // Don't fail the order processing if referral fails
    }

    // Continue with existing order processing logic
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', orderData.id)
      .select()

    if (error) {
      console.error('Error updating order status:', error)
      throw error
    }

    console.log('Order updated:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order processed successfully',
        orderId: orderData.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
