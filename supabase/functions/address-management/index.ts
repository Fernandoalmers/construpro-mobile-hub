

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('[address-management] User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const url = new URL(req.url)
    const addressId = url.searchParams.get('id')

    console.log(`[address-management] ${method} request for user: ${user.id}`, { addressId })

    if (method === 'GET') {
      if (addressId) {
        // Get specific address
        const { data: address, error } = await supabaseClient
          .from('user_addresses')
          .select('*')
          .eq('id', addressId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('[address-management] Error fetching single address:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('[address-management] Single address fetched successfully:', address.id)
        return new Response(
          JSON.stringify({ address }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Get all addresses for user
        const { data: addresses, error } = await supabaseClient
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[address-management] Error fetching addresses:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`[address-management] Fetched ${addresses?.length || 0} addresses for user`)
        return new Response(
          JSON.stringify({ addresses: addresses || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (method === 'POST') {
      const body = await req.json()
      console.log('[address-management] Creating address:', { ...body, user_id: user.id })
      
      // If this address is being set as principal, first unset all others
      if (body.principal) {
        console.log('[address-management] Setting address as principal, unsetting others first')
        const { error: unsetError } = await supabaseClient
          .from('user_addresses')
          .update({ principal: false })
          .eq('user_id', user.id)

        if (unsetError) {
          console.error('[address-management] Error unsetting other addresses:', unsetError)
          return new Response(
            JSON.stringify({ error: `Failed to unset other addresses: ${unsetError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        console.log('[address-management] Successfully unset other principal addresses')
      }

      const { data: address, error } = await supabaseClient
        .from('user_addresses')
        .insert({
          ...body,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('[address-management] Error creating address:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[address-management] Address created successfully:', address.id)
      return new Response(
        JSON.stringify({ address }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PUT') {
      const body = await req.json()
      const { id, ...updateData } = body

      if (!id) {
        console.error('[address-management] PUT request missing address ID')
        return new Response(
          JSON.stringify({ error: 'Address ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[address-management] Updating address:', { id, updateData, user_id: user.id })

      // Enhanced logic for setting principal address
      if (updateData.principal === true) {
        console.log('[address-management] Setting address as principal, implementing robust transaction')
        
        try {
          // First, verify the address exists and belongs to the user
          const { data: existingAddress, error: verifyError } = await supabaseClient
            .from('user_addresses')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

          if (verifyError || !existingAddress) {
            console.error('[address-management] Address not found or unauthorized:', verifyError)
            return new Response(
              JSON.stringify({ error: 'Address not found or unauthorized' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('[address-management] Address verified, proceeding with principal update')

          // Step 1: Unset all other principal addresses for this user
          const { error: unsetError } = await supabaseClient
            .from('user_addresses')
            .update({ principal: false, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .neq('id', id)

          if (unsetError) {
            console.error('[address-management] Error unsetting other principal addresses:', unsetError)
            return new Response(
              JSON.stringify({ error: `Failed to unset other addresses: ${unsetError.message}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('[address-management] Successfully unset other principal addresses')

          // Step 2: Set this address as principal
          const { data: updatedAddress, error: updateError } = await supabaseClient
            .from('user_addresses')
            .update({ 
              ...updateData, 
              principal: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateError) {
            console.error('[address-management] Error setting address as principal:', updateError)
            return new Response(
              JSON.stringify({ error: `Failed to set as principal: ${updateError.message}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('[address-management] Address successfully set as principal:', updatedAddress.id)

          // Step 3: Verify the operation was successful
          const { data: verification, error: verifyFinalError } = await supabaseClient
            .from('user_addresses')
            .select('id, nome, principal')
            .eq('user_id', user.id)

          if (!verifyFinalError && verification) {
            const principalAddresses = verification.filter(addr => addr.principal)
            console.log('[address-management] Final verification - principal addresses:', principalAddresses.length, principalAddresses.map(a => a.id))
            
            if (principalAddresses.length !== 1 || principalAddresses[0].id !== id) {
              console.error('[address-management] Verification failed - incorrect principal state')
              return new Response(
                JSON.stringify({ error: 'Failed to properly set principal address' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }

          return new Response(
            JSON.stringify({ address: updatedAddress }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } catch (transactionError) {
          console.error('[address-management] Transaction error:', transactionError)
          return new Response(
            JSON.stringify({ error: 'Failed to update principal address due to database error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Standard update for non-principal changes
        const { data: address, error } = await supabaseClient
          .from('user_addresses')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('[address-management] Error updating address:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('[address-management] Address updated successfully:', address.id)
        return new Response(
          JSON.stringify({ address }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (method === 'DELETE') {
      const body = await req.json()
      const { id } = body

      if (!id) {
        console.error('[address-management] DELETE request missing address ID')
        return new Response(
          JSON.stringify({ error: 'Address ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[address-management] Deleting address:', { id, user_id: user.id })

      const { error } = await supabaseClient
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('[address-management] Error deleting address:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[address-management] Address deleted successfully')
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[address-management] Method not allowed:', method)
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[address-management] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

