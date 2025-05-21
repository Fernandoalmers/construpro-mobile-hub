
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleGetOrders, handleGetOrderById, handleCreateOrder } from './handlers.ts'
import { corsHeaders } from './utils.ts'

serve(async (req) => {
  console.log(`Order processing function called: ${req.method} ${new URL(req.url).pathname}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header required' 
        }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Process request based on method
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    let orderId: string | null = null;
    
    // Check if the path contains an ID
    const lastPathSegment = path[path.length - 1];
    if (lastPathSegment && lastPathSegment !== 'order-processing') {
      orderId = lastPathSegment;
      console.log(`Order ID found in path: ${orderId}`);
    }
    
    // If no orderId in path, check headers
    if (!orderId) {
      const headerOrderId = req.headers.get('order-id');
      if (headerOrderId) {
        orderId = headerOrderId;
        console.log(`Order ID found in header: ${orderId}`);
      }
    }
    
    // If still no orderId, check request body for POST or GET with body
    if (!orderId && (req.method === 'GET' || req.method === 'POST')) {
      // Clone the request to avoid consuming it
      const clonedReq = req.clone();
      try {
        const bodyData = await clonedReq.json();
        if (bodyData && bodyData.orderId) {
          orderId = bodyData.orderId;
          console.log(`Order ID found in request body: ${orderId}`);
        }
      } catch (e) {
        // No JSON body or not parseable, that's OK
      }
    }
    
    console.log(`Request parsed: Method=${req.method}, OrderId=${orderId || 'none'}`);

    // GET /order-processing - List user's orders
    if (req.method === 'GET' && !orderId) {
      console.log("Handling GET request for all orders");
      return await handleGetOrders(req, authHeader)
    }
    
    // GET /order-processing/:id - Get specific order
    if (req.method === 'GET' && orderId) {
      console.log(`Handling GET request for order ID: ${orderId}`);
      return await handleGetOrderById(req, authHeader, orderId)
    }
    
    // POST /order-processing - Create a new order
    if (req.method === 'POST') {
      console.log("Handling POST request to create new order");
      return await handleCreateOrder(req, authHeader)
    }
    
    // If the request doesn't match any of the above conditions
    console.log(`Unhandled request type: ${req.method}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed or invalid endpoint' 
      }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Unexpected error in order-processing function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        trace: error.stack || 'No stack trace available'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
