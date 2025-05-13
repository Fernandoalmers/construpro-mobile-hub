
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleGetOrders, handleGetOrderById, handleCreateOrder } from './handlers.ts'
import { corsHeaders } from './utils.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Process request based on method
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const orderId = path[path.length - 1] !== 'order-processing' ? path[path.length - 1] : null

    // GET /order-processing - List user's orders
    if (req.method === 'GET' && !orderId) {
      return await handleGetOrders(req, authHeader)
    }
    
    // GET /order-processing/:id - Get specific order
    if (req.method === 'GET' && orderId) {
      return await handleGetOrderById(req, authHeader, orderId)
    }
    
    // POST /order-processing - Create a new order
    if (req.method === 'POST') {
      return await handleCreateOrder(req, authHeader)
    }
    
    // If the request doesn't match any of the above conditions
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
