
// This edge function will update the get_product_segments database function
// to include the new image_url and status fields

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // First, drop the existing function
    const { error: dropError } = await supabase.rpc("admin_query", {
      query: `DROP FUNCTION IF EXISTS public.get_product_segments();`
    });

    if (dropError) {
      throw dropError;
    }

    // Now create the updated function with proper search_path
    const { error } = await supabase.rpc("admin_query", {
      query: `
        CREATE OR REPLACE FUNCTION public.get_product_segments()
        RETURNS TABLE(id uuid, nome text, image_url text, status text)
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
          SELECT id, nome, image_url, status FROM public.product_segments ORDER BY nome;
        $function$;
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Function get_product_segments updated successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
