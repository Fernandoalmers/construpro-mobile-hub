
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from './vendorProfileService';
import { VendorCustomer } from './vendorCustomersService';

export interface PointAdjustment {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  tipo: string;
  valor: number;
  motivo: string;
  created_at?: string;
  cliente?: VendorCustomer;
}

// Points Adjustment Management
export const getPointAdjustments = async (userId?: string): Promise<PointAdjustment[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    console.log('Fetching point adjustments for vendor:', vendorProfile.id, 'and user:', userId || 'all users');
    
    let query = supabase
      .from('pontos_ajustados')
      .select(`
        *,
        cliente:usuario_id (
          id,
          nome,
          email,
          telefone
        )
      `)
      .eq('vendedor_id', vendorProfile.id);
    
    if (userId) {
      query = query.eq('usuario_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching point adjustments:', error);
      return [];
    }

    console.log('Point adjustments found:', data?.length || 0);

    // Create safe adjustments with proper cliente handling
    const safeAdjustments = data.map(item => {
      // Create a cliente object safely
      const clienteData = item.cliente as any;
      const clienteInfo: VendorCustomer = {
        id: item.usuario_id || '',
        vendedor_id: vendorProfile.id,
        usuario_id: item.usuario_id,
        nome: clienteData && clienteData.nome ? clienteData.nome : 'Cliente',
        telefone: clienteData && clienteData.telefone ? clienteData.telefone : '',
        email: clienteData && clienteData.email ? clienteData.email : '',
        total_gasto: 0
      };
      
      return {
        ...item,
        cliente: clienteInfo
      };
    });
    
    return safeAdjustments as PointAdjustment[];
  } catch (error) {
    console.error('Error in getPointAdjustments:', error);
    return [];
  }
};

// Ensure the customer exists in clientes_vendedor table
const ensureCustomerExists = async (
  vendorId: string,
  userId: string,
  customerData: { nome: string, email?: string, telefone?: string }
): Promise<boolean> => {
  try {
    console.log('Ensuring customer exists:', { vendorId, userId, customerData });
    
    // Check if customer already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing customer:', checkError);
      return false;
    }
    
    if (existingCustomer) {
      console.log('Customer already exists:', existingCustomer);
      return true;
    }
    
    // Create customer if not exists
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .insert({
        vendedor_id: vendorId,
        usuario_id: userId,
        nome: customerData.nome,
        email: customerData.email || null,
        telefone: customerData.telefone || null,
        total_gasto: 0,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error creating customer:', insertError);
      return false;
    }
    
    console.log('Customer created successfully');
    return true;
  } catch (error) {
    console.error('Error in ensureCustomerExists:', error);
    return false;
  }
};

export const createPointAdjustment = async (
  userId: string,
  tipo: string,
  valor: number,
  motivo: string
): Promise<boolean> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return false;
    }

    console.log('Creating point adjustment for user:', userId, 'by vendor:', vendorProfile.id);
    
    // Store the vendor ID in localStorage for filtering in the UI
    localStorage.setItem('vendor_profile_id', vendorProfile.id);
    
    // Get customer profile data
    const { data: customerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching customer profile:', profileError);
      toast.error('Erro ao buscar dados do cliente');
      return false;
    }
    
    // Ensure the customer exists in the vendor's customer list
    const customerCreated = await ensureCustomerExists(
      vendorProfile.id,
      userId,
      {
        nome: customerProfile.nome || 'Cliente',
        email: customerProfile.email,
        telefone: customerProfile.telefone
      }
    );
    
    if (!customerCreated) {
      console.warn('Could not create/verify customer relationship, but will continue with point adjustment');
    }
    
    // Calculate the actual value based on tipo
    // If removing points (remocao), we need to store a negative value
    const adjustmentValue = tipo === 'remocao' ? -Math.abs(valor) : Math.abs(valor);
    
    // Insert the points adjustment record
    // The database triggers we created will handle:
    // 1. Updating the user's points balance via update_points_on_adjustment trigger
    // 2. Creating a transaction record via register_transaction_after_adjustment trigger
    const { error: insertError } = await supabase
      .from('pontos_ajustados')
      .insert({
        vendedor_id: vendorProfile.id,
        usuario_id: userId,
        tipo,
        valor: adjustmentValue,  // Store as positive for adicao, negative for remocao
        motivo
      });
    
    if (insertError) {
      console.error('Error creating point adjustment:', insertError);
      toast.error('Erro ao ajustar pontos');
      return false;
    }
    
    console.log('Point adjustment created successfully');
    return true;
  } catch (error) {
    console.error('Error creating point adjustment:', error);
    toast.error('Erro ao ajustar pontos');
    return false;
  }
};
