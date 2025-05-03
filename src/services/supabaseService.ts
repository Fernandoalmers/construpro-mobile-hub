
import { supabase } from "@/integrations/supabase/client";

export const invokeFunction = async (
  functionName: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body: Record<string, any>
) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      method,
      body
    });

    if (error) {
      console.error(`Error invoking ${functionName}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error in ${functionName}:`, error);
    throw error;
  }
};
