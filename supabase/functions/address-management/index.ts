
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

interface AddressData {
  id?: string;
  nome: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    console.log("Address management function called, method:", req.method);
    
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log("Auth token received (first 10 chars):", token.substring(0, 10) + "...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) {
      console.error("Authentication error:", authError.message);
      return new Response(
        JSON.stringify({ error: authError.message || 'Authentication failed' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    if (!user) {
      console.error("No user found with the provided token");
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    console.log("Authenticated user ID:", user.id);
    
    // Process request based on method
    const method = req.method
    let reqBody = {}
    
    // Parse request body for POST/PUT/DELETE methods
    if (method !== 'GET') {
      try {
        const bodyText = await req.text()
        console.log("Request body text:", bodyText);
        
        if (bodyText) {
          reqBody = JSON.parse(bodyText)
          console.log("Parsed request body:", reqBody);
        } else {
          console.error("Empty request body");
          return new Response(
            JSON.stringify({ error: 'Empty request body' }),
            { status: 400, headers: corsHeaders }
          )
        }
      } catch (e) {
        console.error("Error parsing request body:", e);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: corsHeaders }
        )
      }
    }
    
    // GET - List all addresses
    if (method === 'GET') {
      // Check if we have an ID in the request body (for getting a specific address)
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const addressId = pathSegments[pathSegments.length - 1] !== 'address-management' ? 
                         pathSegments[pathSegments.length - 1] : null
      
      if (addressId) {
        // GET specific address
        const { data: address, error } = await supabaseClient
          .from('user_addresses')
          .select('*')
          .eq('id', addressId)
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          console.error("Error fetching specific address:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: error.code === 'PGRST116' ? 404 : 500, headers: corsHeaders }
          )
        }
        
        return new Response(
          JSON.stringify({ address }),
          { status: 200, headers: corsHeaders }
        )
      } else {
        // GET all addresses
        const { data: addresses, error } = await supabaseClient
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('principal', { ascending: false })
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error("Error fetching all addresses:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        console.log(`Found ${addresses?.length || 0} addresses for user ${user.id}`);
        return new Response(
          JSON.stringify({ addresses }),
          { status: 200, headers: corsHeaders }
        )
      }
    }
    
    // POST - Create new address
    if (method === 'POST') {
      const addressData = reqBody as AddressData;
      
      // Validate required fields
      const requiredFields = ['nome', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado']
      const missingFields = requiredFields.filter(field => !addressData[field as keyof AddressData])
      
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return new Response(
          JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      console.log("Creating new address for user:", user.id, "Address data:", addressData);
      
      // If this address is set as principal, update all other addresses
      if (addressData.principal) {
        console.log("Setting as principal address - updating other addresses");
        const { error: updateError } = await supabaseClient
          .from('user_addresses')
          .update({ principal: false })
          .eq('user_id', user.id)
        
        if (updateError) {
          console.error("Error updating other addresses:", updateError);
        }
      }
      
      // Insert new address
      const { data: address, error } = await supabaseClient
        .from('user_addresses')
        .insert({
          ...addressData,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        console.error("Error inserting new address:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      console.log("Address created successfully:", address?.id);
      return new Response(
        JSON.stringify({ success: true, address }),
        { status: 201, headers: corsHeaders }
      )
    }
    
    // PUT - Update address
    if (method === 'PUT') {
      const { id, ...addressData } = reqBody as AddressData & { id: string };
      
      if (!id) {
        console.error("No address ID provided for update");
        return new Response(
          JSON.stringify({ error: 'Address ID is required' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      console.log("Updating address:", id, "for user:", user.id);
      
      // If this address is set as principal, update all other addresses
      if (addressData.principal) {
        console.log("Setting as principal address - updating other addresses");
        const { error: updateError } = await supabaseClient
          .from('user_addresses')
          .update({ principal: false })
          .eq('user_id', user.id)
          .neq('id', id)
        
        if (updateError) {
          console.error("Error updating other addresses during edit:", updateError);
        }
      }
      
      // Update address
      const { data: address, error } = await supabaseClient
        .from('user_addresses')
        .update(addressData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error("Error updating address:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      console.log("Address updated successfully");
      return new Response(
        JSON.stringify({ success: true, address }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // DELETE - Delete address
    if (method === 'DELETE') {
      const { id } = reqBody as { id: string };
      
      if (!id) {
        console.error("No address ID provided for deletion");
        return new Response(
          JSON.stringify({ error: 'Address ID is required' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      console.log("Attempting to delete address:", id, "for user:", user.id);
      
      // Check if it's the principal address
      const { data: address } = await supabaseClient
        .from('user_addresses')
        .select('principal')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      
      if (address?.principal) {
        console.error("Attempted to delete principal address");
        return new Response(
          JSON.stringify({ error: 'Cannot delete principal address. Set another address as principal first.' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Delete address
      const { error } = await supabaseClient
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) {
        console.error("Error deleting address:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      console.log("Address deleted successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // If the request doesn't match any of the above conditions
    console.error("Method not allowed:", method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("Unexpected error in address-management:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    )
  }
})
