
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a database trigger and supporting functions to automatically update
 * vendor customers table when new orders are created.
 * 
 * This function is needed because some complex SQL triggers might need to be 
 * created via individual SQL statements rather than in a single migration.
 */
export const setupVendorCustomerTrigger = async (): Promise<boolean> => {
  try {
    // Step 1: First ensure the SQL execution function exists by calling the edge function
    const session = await supabase.auth.getSession();
    if (!session?.data?.session) {
      console.error('No active session found');
      return false;
    }
    const token = session.data.session.access_token;
    
    // Call the create-sql-function edge function to ensure our SQL function exists
    try {
      const functionResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/create-sql-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!functionResponse.ok) {
        const errorData = await functionResponse.json();
        console.error('Error setting up SQL function:', errorData);
        return false;
      }
      
      console.log('SQL function setup successful');
    } catch (error) {
      console.error('Error calling SQL function setup:', error);
      // Continue anyway as the function might already exist
    }
    
    // Step 2: Create the log table if it doesn't exist
    const { error: tableError } = await supabase.rpc('begin_transaction');
    
    if (tableError) {
      console.error('Error beginning transaction:', tableError);
      return false;
    }
    
    // Call db-utils edge function to execute SQL safely
    const createLogTable = await executeSqlViaFunction(`
      CREATE TABLE IF NOT EXISTS public.vendor_orders_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    
    if (!createLogTable.success) {
      console.error('Error creating log table:', createLogTable.error);
      await supabase.rpc('rollback_transaction');
      return false;
    }
    
    // Step 3: Create the function that handles the order processing
    const createFunction = await executeSqlViaFunction(`
      CREATE OR REPLACE FUNCTION public.update_vendor_customer_data()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      DECLARE
        customer_name TEXT;
        customer_email TEXT;
        customer_phone TEXT;
        vendor_id UUID;
        vendor_name TEXT;
        vendor_total NUMERIC;
        order_items_record RECORD;
      BEGIN
        -- Get customer info from profiles
        SELECT nome, email, telefone INTO customer_name, customer_email, customer_phone
        FROM profiles WHERE id = NEW.cliente_id;
        
        -- Insert initial log for debugging
        INSERT INTO public.vendor_orders_log (order_id, message)
        VALUES (NEW.id, 'Processing order for customer: ' || NEW.cliente_id);
        
        -- Find all vendors for products in this order
        FOR order_items_record IN (
          SELECT DISTINCT p.vendedor_id, v.nome_loja
          FROM order_items oi
          JOIN produtos p ON oi.produto_id = p.id
          JOIN vendedores v ON p.vendedor_id = v.id
          WHERE oi.order_id = NEW.id
        ) LOOP
          vendor_id := order_items_record.vendedor_id;
          vendor_name := order_items_record.nome_loja;
          
          -- Calculate total spent with this vendor for this order
          SELECT COALESCE(SUM(oi.subtotal), 0) INTO vendor_total
          FROM order_items oi
          JOIN produtos p ON oi.produto_id = p.id
          WHERE oi.order_id = NEW.id AND p.vendedor_id = vendor_id;
          
          -- Insert or update customer in clientes_vendedor table
          INSERT INTO public.clientes_vendedor (
            vendedor_id, usuario_id, nome, telefone, email, 
            ultimo_pedido, total_gasto, created_at, updated_at
          ) VALUES (
            vendor_id,
            NEW.cliente_id,
            customer_name,
            customer_phone,
            customer_email,
            NEW.created_at,
            vendor_total,
            now(),
            now()
          )
          ON CONFLICT (vendedor_id, usuario_id)
          DO UPDATE SET
            nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            email = EXCLUDED.email,
            ultimo_pedido = GREATEST(clientes_vendedor.ultimo_pedido, NEW.created_at),
            total_gasto = clientes_vendedor.total_gasto + vendor_total,
            updated_at = now();
            
          -- Log this operation
          INSERT INTO public.vendor_orders_log (order_id, message)
          VALUES (NEW.id, 'Updated customer record for vendor: ' || vendor_name);
        END LOOP;
        
        RETURN NEW;
      END;
      $function$;
    `);
    
    if (!createFunction.success) {
      console.error('Error creating function:', createFunction.error);
      await supabase.rpc('rollback_transaction');
      return false;
    }
    
    // Step 4: Create the trigger
    const createTrigger = await executeSqlViaFunction(`
      DROP TRIGGER IF EXISTS update_vendor_customers_on_order ON public.orders;
      CREATE TRIGGER update_vendor_customers_on_order
        AFTER INSERT ON public.orders
        FOR EACH ROW EXECUTE FUNCTION public.update_vendor_customer_data();
    `);
    
    if (!createTrigger.success) {
      console.error('Error creating trigger:', createTrigger.error);
      await supabase.rpc('rollback_transaction');
      return false;
    }
    
    // Step 5: Create the migration function
    const createMigrationFunction = await executeSqlViaFunction(`
      CREATE OR REPLACE FUNCTION public.migrate_orders_to_vendor_customers()
      RETURNS integer
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      DECLARE
        processed_count INTEGER := 0;
        order_record RECORD;
        customer_name TEXT;
        customer_email TEXT;
        customer_phone TEXT;
        vendor_record RECORD;
        vendor_total NUMERIC;
      BEGIN
        -- Log start of migration
        INSERT INTO public.vendor_orders_log (order_id, message)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Starting migration of orders to vendor customers');
        
        -- Process each order
        FOR order_record IN (
          SELECT * FROM public.orders
          ORDER BY created_at
        ) LOOP
          -- Get customer info
          SELECT nome, email, telefone INTO customer_name, customer_email, customer_phone
          FROM profiles WHERE id = order_record.cliente_id;
          
          -- Find all vendors for this order's products
          FOR vendor_record IN (
            SELECT DISTINCT v.id as vendor_id, v.nome_loja
            FROM order_items oi
            JOIN produtos p ON oi.produto_id = p.id
            JOIN vendedores v ON p.vendedor_id = v.id
            WHERE oi.order_id = order_record.id
          ) LOOP
            -- Calculate total for this vendor in this order
            SELECT COALESCE(SUM(oi.subtotal), 0) INTO vendor_total
            FROM order_items oi
            JOIN produtos p ON oi.produto_id = p.id
            WHERE oi.order_id = order_record.id AND p.vendedor_id = vendor_record.vendor_id;
            
            -- Log order processing
            INSERT INTO public.vendor_orders_log (order_id, message)
            VALUES (order_record.id, 'Processing order for vendor: ' || vendor_record.nome_loja);
            
            -- Insert or update customer record
            INSERT INTO public.clientes_vendedor (
              vendedor_id, usuario_id, nome, telefone, email, 
              ultimo_pedido, total_gasto, created_at, updated_at
            ) VALUES (
              vendor_record.vendor_id,
              order_record.cliente_id,
              customer_name,
              customer_phone,
              customer_email,
              order_record.created_at,
              vendor_total,
              now(),
              now()
            )
            ON CONFLICT (vendedor_id, usuario_id)
            DO UPDATE SET
              nome = EXCLUDED.nome,
              telefone = EXCLUDED.telefone,
              email = EXCLUDED.email,
              ultimo_pedido = GREATEST(clientes_vendedor.ultimo_pedido, order_record.created_at),
              total_gasto = clientes_vendedor.total_gasto + vendor_total,
              updated_at = now();
              
            -- Increment counter
            processed_count := processed_count + 1;
          END LOOP;
        END LOOP;
        
        -- Log completion
        INSERT INTO public.vendor_orders_log (order_id, message)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Completed migration of orders to vendor customers. Processed ' || processed_count || ' records');
        
        RETURN processed_count;
      END;
      $function$;
    `);
    
    if (!createMigrationFunction.success) {
      console.error('Error creating migration function:', createMigrationFunction.error);
      await supabase.rpc('rollback_transaction');
      return false;
    }
    
    // Commit all changes
    const { error: commitError } = await supabase.rpc('commit_transaction');
    
    if (commitError) {
      console.error('Error committing transaction:', commitError);
      await supabase.rpc('rollback_transaction');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setupVendorCustomerTrigger:', error);
    await supabase.rpc('rollback_transaction');
    return false;
  }
};

/**
 * Helper function to execute SQL via the db-utils edge function
 * with improved error handling and authentication
 */
async function executeSqlViaFunction(sqlString: string) {
  try {
    // First get the session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available for SQL execution');
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/db-utils`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        method: 'POST',
        action: 'execute-sql',
        sql: sqlString
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from db-utils:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error };
  }
}

/**
 * Manually executes the order migration function in the database
 * with improved error handling
 */
export const runOrderMigration = async (): Promise<number> => {
  try {
    console.log('Starting order migration process...');
    
    // First ensure all required functions and triggers are set up
    const setupSuccess = await setupVendorCustomerTrigger();
    
    if (!setupSuccess) {
      console.error('Failed to set up database triggers and functions');
      return 0;
    }
    
    console.log('Database triggers and functions set up successfully, running migration...');
    
    // Use the db-utils edge function to call the function
    const result = await executeSqlViaFunction('SELECT public.migrate_orders_to_vendor_customers()');
    
    if (!result.success) {
      console.error('Error running order migration:', result.error);
      return 0;
    }
    
    console.log('Migration completed:', result);
    
    // Safely handle the response
    if (result.data && result.data.status === 'success') {
      // Try to extract the count from the result
      try {
        const countMatch = JSON.stringify(result.data).match(/\d+/);
        if (countMatch) {
          return parseInt(countMatch[0], 10);
        }
      } catch (e) {
        console.error('Error parsing migration result:', e);
      }
      return 1; // Return 1 if successful but couldn't parse count
    }
    
    return 0;
  } catch (error) {
    console.error('Error in runOrderMigration:', error);
    return 0;
  }
};

/**
 * A complete function that sets up the database triggers and runs the migration
 * with improved logging and error handling
 */
export const setupAndMigrateCustomerData = async (): Promise<{ 
  success: boolean;
  migratedCount: number;
  message: string; 
}> => {
  try {
    console.log('Starting setup and migration of customer data...');
    
    // First setup the database functions and triggers
    const setupSuccess = await setupVendorCustomerTrigger();
    
    if (!setupSuccess) {
      console.error('Failed to set up database functions and triggers');
      return {
        success: false,
        migratedCount: 0,
        message: 'Falha ao configurar gatilhos de banco de dados'
      };
    }
    
    console.log('Database setup successful, running migration...');
    
    // Then run the migration
    const migratedCount = await runOrderMigration();
    
    console.log(`Migration completed, processed ${migratedCount} records`);
    
    if (migratedCount > 0) {
      return {
        success: true,
        migratedCount,
        message: `${migratedCount} registros de clientes migrados com sucesso`
      };
    } else {
      return {
        success: true,
        migratedCount: 0,
        message: 'Configuração concluída, mas nenhum cliente foi migrado. Verifique se existem pedidos.'
      };
    }
  } catch (error) {
    console.error('Error in setupAndMigrateCustomerData:', error);
    return {
      success: false,
      migratedCount: 0,
      message: 'Erro ao configurar e migrar dados de clientes'
    };
  }
};
