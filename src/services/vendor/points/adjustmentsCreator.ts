
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '../../vendorProfileService';
import { ensureCustomerExists } from './customerManager';

// Store recent transactions to prevent duplicates
const recentTransactions = new Map<string, number>();

// Clear old transactions from memory (5 minutes threshold)
setInterval(() => {
  const now = Date.now();
  for (const [transactionId, timestamp] of recentTransactions.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      recentTransactions.delete(transactionId);
    }
  }
}, 60000); // Clean up every minute

/**
 * Creates a point adjustment for a user and updates their balance
 */
export const createPointAdjustment = async (
  userId: string,
  tipo: string,
  valor: number,
  motivo: string,
  transactionId?: string
): Promise<boolean> => {
  try {
    console.log('Creating point adjustment with params:', { userId, tipo, valor, motivo, transactionId });
    
    // Check for duplicate transaction if an ID is provided
    if (transactionId && recentTransactions.has(transactionId)) {
      console.warn('Duplicate transaction detected, ignoring:', transactionId);
      toast.error('Operação já está sendo processada. Aguarde ou tente novamente em alguns instantes.');
      return false;
    }
    
    // Register this transaction attempt
    if (transactionId) {
      recentTransactions.set(transactionId, Date.now());
    }
    
    // Get vendor profile - using stored ID first if available
    const storedVendorId = localStorage.getItem('vendor_profile_id');
    let vendorProfile;
    
    if (storedVendorId) {
      console.log('Using stored vendor ID:', storedVendorId);
      // Verify the stored ID is still valid
      const { data: vendorCheck, error: vendorCheckError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('id', storedVendorId)
        .maybeSingle();
        
      if (vendorCheckError) {
        console.warn('Error verifying stored vendor ID:', vendorCheckError);
      }
      
      if (vendorCheck) {
        vendorProfile = vendorCheck;
        console.log('Verified vendor from stored ID:', vendorProfile.nome_loja);
      } else {
        console.log('Stored vendor ID not valid, fetching current profile');
        vendorProfile = await getVendorProfile();
      }
    } else {
      vendorProfile = await getVendorProfile();
    }
    
    if (!vendorProfile || !vendorProfile.id) {
      console.error('Vendor profile not found or incomplete:', vendorProfile);
      toast.error('Perfil de vendedor não encontrado. Por favor, faça login novamente.');
      return false;
    }

    console.log('Creating point adjustment for user:', userId, 'by vendor:', vendorProfile.id);
    
    // Store the vendor ID in localStorage for filtering in the UI and future operations
    localStorage.setItem('vendor_profile_id', vendorProfile.id);
    
    // Validate the userId format
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error('Invalid UUID format for user ID:', userId);
      toast.error('Formato de ID de usuário inválido');
      return false;
    }
    
    console.log('Looking up customer profile with ID:', userId);
    
    // First check if this is actually a relation ID instead of a user ID
    const { data: relationCheck, error: relationError } = await supabase
      .from('clientes_vendedor')
      .select('id, usuario_id, nome, email, telefone')
      .eq('id', userId)
      .maybeSingle();
      
    if (relationError) {
      console.error('Error checking relation:', relationError);
    }
    
    // If we found a relation and it has usuario_id, use that instead
    if (relationCheck && relationCheck.usuario_id) {
      console.log('ID provided is a relation ID, using usuario_id instead:', relationCheck.usuario_id);
      userId = relationCheck.usuario_id;
      
      // Show a warning in development, but continue with the right ID
      console.warn('Relation ID was passed instead of user ID - switching to correct user ID');
    }
    
    // Get customer profile data - using maybeSingle instead of single to prevent errors
    const { data: customerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching customer profile:', profileError);
      toast.error('Erro ao buscar dados do cliente');
      return false;
    }
    
    console.log('Customer profile lookup result:', customerProfile ? 'Found' : 'Not found');
    
    let customerData: any = null;
    
    if (!customerProfile) {
      console.error('Customer profile not found in profiles table for ID:', userId);
      
      // If profile not found, try to get data from cliente_vendedor table instead
      const { data: vendorCustomerData, error: vendorCustomerError } = await supabase
        .from('clientes_vendedor')
        .select('id, usuario_id, nome, email, telefone')
        .eq('usuario_id', userId)
        .eq('vendedor_id', vendorProfile.id)
        .maybeSingle();
        
      if (vendorCustomerError) {
        console.error('Error checking vendor customer data:', vendorCustomerError);
      }
      
      if (vendorCustomerData) {
        console.log('Found customer data in cliente_vendedor table:', vendorCustomerData);
        customerData = {
          id: userId,
          nome: vendorCustomerData.nome || 'Cliente',
          email: vendorCustomerData.email,
          telefone: vendorCustomerData.telefone,
          cpf: null // CPF field doesn't exist in clientes_vendedor table
        };
      } else {
        console.error('Customer not found in any table. ID:', userId);
        toast.error('Perfil de cliente não encontrado. Verifique o ID do usuário.');
        return false;
      }
    } else {
      customerData = customerProfile;
    }
    
    console.log('Using customer data:', customerData);
    
    // Validate the point adjustment type
    if (tipo !== 'adicao' && tipo !== 'remocao') {
      console.error('Invalid adjustment type:', tipo);
      toast.error('Tipo de ajuste inválido. Use "adicao" ou "remocao".');
      return false;
    }
    
    // Ensure the customer exists in the vendor's customer list
    const customerCreated = await ensureCustomerExists(
      vendorProfile.id,
      userId,
      {
        nome: customerData.nome || 'Cliente',
        email: customerData.email,
        telefone: customerData.telefone,
        cpf: customerData.cpf
      }
    );
    
    if (!customerCreated) {
      console.warn('Could not create/verify customer relationship, but will continue with point adjustment');
    }
    
    // Calculate the actual value based on tipo
    // If removing points (remocao), we need to store a negative value
    const adjustmentValue = tipo === 'remocao' ? -Math.abs(valor) : Math.abs(valor);
    
    console.log('Preparing to insert point adjustment with value:', adjustmentValue);
    
    // First check if a similar transaction already exists in the last minute to prevent duplicates
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    const { data: recentAdjustment, error: recentAdjustmentError } = await supabase
      .from('pontos_ajustados')
      .select('id, valor, motivo, created_at')
      .eq('vendedor_id', vendorProfile.id)
      .eq('usuario_id', userId)
      .eq('tipo', tipo)
      .eq('valor', adjustmentValue)
      .gte('created_at', oneMinuteAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (recentAdjustmentError) {
      console.warn('Error checking for recent adjustments:', recentAdjustmentError);
      // Continue anyway as this is just a duplicate check
    }
    
    if (recentAdjustment && recentAdjustment.length > 0) {
      console.warn('Possible duplicate transaction detected within last minute:', recentAdjustment[0]);
      toast.warning('Uma transação similar já foi realizada no último minuto. Aguarde ou use um valor diferente.');
      return false;  // Prevent the duplicate
    }
    
    // Check if a transaction with this exact ID already exists
    if (transactionId) {
      const { data: existingTransactionCheck, error: transactionCheckError } = await supabase
        .from('pontos_ajustados')
        .select('id')
        .eq('motivo', `${motivo} [${transactionId}]`) // Check if this exact transaction ID is in the motivo field
        .maybeSingle();
        
      if (transactionCheckError) {
        console.warn('Error checking for existing transaction:', transactionCheckError);
      }
      
      if (existingTransactionCheck) {
        console.warn('Transaction with this ID already exists:', existingTransactionCheck.id);
        toast.warning('Esta transação já foi processada. Evitando duplicação.');
        return false;
      }
    }
    
    // Insert the point adjustment record - with transaction ID embedded in motivo to track
    const adjustmentMotivo = transactionId ? `${motivo} [${transactionId}]` : motivo;
    
    // Insert the point adjustment record
    const { data: insertData, error: insertError } = await supabase
      .from('pontos_ajustados')
      .insert({
        vendedor_id: vendorProfile.id,
        usuario_id: userId,
        tipo: tipo,
        valor: adjustmentValue,
        motivo: adjustmentMotivo  // Include transaction ID in motivo for traceability
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error('Error creating point adjustment:', insertError);
      toast.error('Erro ao ajustar pontos: ' + insertError.message);
      return false;
    }
    
    console.log('Point adjustment created successfully:', insertData);
    
    // Manually update the user's points balance instead of relying on triggers
    const { error: pointsError } = await supabase.rpc(
      'update_user_points',
      { user_id: userId, points_to_add: adjustmentValue }
    );
    
    if (pointsError) {
      console.error('Error updating user points:', pointsError);
      toast.error('Erro ao atualizar pontos do usuário: ' + pointsError.message);
      return false;
    }
    
    // Instead of creating a transaction record directly,
    // we'll rely on the database trigger to create it once
    // which helps prevent duplicate entries
    
    toast.success('Ajuste de pontos realizado com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error creating point adjustment:', error);
    toast.error(`Erro ao ajustar pontos: ${error?.message || 'Verifique o console para detalhes'}`);
    return false;
  }
};
