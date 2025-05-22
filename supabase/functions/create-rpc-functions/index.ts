
// This edge function will create the RPC functions needed for the points adjustment system
// These functions will bypass RLS policies by using SECURITY DEFINER

// To deploy this function, you can run:
// supabase functions deploy create-rpc-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the auth header
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // SQL to create functions
    const createPointAdjustmentFunction = `
      CREATE OR REPLACE FUNCTION public.create_point_adjustment(
        p_vendedor_id UUID,
        p_usuario_id UUID,
        p_tipo TEXT,
        p_valor INTEGER,
        p_motivo TEXT
      ) RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        new_id UUID;
        result JSON;
      BEGIN
        -- Insert the point adjustment record
        INSERT INTO public.pontos_ajustados(
          vendedor_id,
          usuario_id,
          tipo,
          valor,
          motivo
        )
        VALUES (
          p_vendedor_id,
          p_usuario_id,
          p_tipo,
          p_valor,
          p_motivo
        )
        RETURNING id INTO new_id;
        
        -- Construct and return result
        SELECT json_build_object(
          'id', new_id,
          'vendedor_id', p_vendedor_id,
          'usuario_id', p_usuario_id,
          'tipo', p_tipo,
          'valor', p_valor,
          'motivo', p_motivo
        ) INTO result;
        
        RETURN result;
      END;
      $$;
    `;

    const getPointAdjustmentsFunction = `
      CREATE OR REPLACE FUNCTION public.get_point_adjustments_for_vendor(
        p_usuario_id UUID,
        p_vendedor_id UUID
      ) RETURNS SETOF pontos_ajustados
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        RETURN QUERY 
        SELECT *
        FROM public.pontos_ajustados
        WHERE usuario_id = p_usuario_id
        AND vendedor_id = p_vendedor_id
        ORDER BY created_at DESC;
      END;
      $$;
    `;

    // Execute the SQL to create the functions
    const { error: error1 } = await supabase.rpc('execute_custom_sql', { 
      sql_statement: createPointAdjustmentFunction 
    });
    
    if (error1) {
      return new Response(
        JSON.stringify({ error: `Error creating create_point_adjustment function: ${error1.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: error2 } = await supabase.rpc('execute_custom_sql', { 
      sql_statement: getPointAdjustmentsFunction 
    });
    
    if (error2) {
      return new Response(
        JSON.stringify({ error: `Error creating get_point_adjustments_for_vendor function: ${error2.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "RPC functions created successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
