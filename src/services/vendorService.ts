// This file re-exports all vendor services for backward compatibility
import { getVendorProfile, saveVendorProfile, uploadVendorImage, VendorProfile } from './vendorProfileService';
import { 
  getVendorOrders,
  updateOrderStatus,
  VendorOrder,
  OrderItem 
} from './vendor/orders';
import { 
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints,
  VendorCustomer 
} from './vendorCustomersService';
import { 
  getPointAdjustments,
  createPointAdjustment,
  PointAdjustment
} from './vendorPointsService';

// Import and re-export from our new modular product services
import {
  // Types
  VendorProduct, ProductImage,
  
  // Product functions
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages,
  subscribeToVendorProducts
} from './vendor/products';

// Type exports
export type { VendorProfile };
export type { VendorProduct };
export type { VendorOrder, OrderItem };
export type { VendorCustomer };
export type { PointAdjustment };
export type { ProductImage };
  
// Function exports
export {
  // Vendor Profile
  getVendorProfile,
  saveVendorProfile,
  uploadVendorImage,

  // Products
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages,
  subscribeToVendorProducts,
  
  // Orders
  getVendorOrders,
  updateOrderStatus,
  
  // Customers
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints,
  
  // Points
  getPointAdjustments,
  createPointAdjustment
};

export interface VendorCustomer {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  nome: string;
  telefone?: string;
  email?: string;
  ultimo_pedido?: string;
  total_gasto: number;
  created_at?: string;
  updated_at?: string;
  avatar?: string | null;
}

export interface PointAdjustment {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  valor: number;
  motivo: string;
  tipo: 'adicao' | 'remocao';
  created_at?: string;
}

// Search for customers by name, email, or phone
export const searchCustomers = async (searchTerm: string): Promise<any[]> => {
  try {
    // If search term is too short, don't search
    if (searchTerm.length < 3) {
      console.log('Search term too short, minimum 3 characters required');
      return [];
    }
    
    console.log('Searching profiles with term:', searchTerm);
    
    // Check if it's a specific UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(searchTerm)) {
      console.log('Searching for specific user ID:', searchTerm);
      const { data: specificUser, error: specificError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .eq('id', searchTerm)
        .limit(1);
        
      if (!specificError && specificUser && specificUser.length > 0) {
        console.log('Found specific user by ID:', specificUser);
        return specificUser;
      }
    }
    
    // Special handling for email format
    if (searchTerm.includes('@')) {
      console.log('Searching by email:', searchTerm);
      const { data: emailUsers, error: emailError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .ilike('email', `%${searchTerm}%`)
        .limit(10);
        
      if (!emailError && emailUsers && emailUsers.length > 0) {
        console.log('Found users by email:', emailUsers);
        return emailUsers;
      }
    }
    
    // Otherwise search by text terms (name, email, phone, cpf)
    console.log('Performing general text search for:', searchTerm);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(10);
    
    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }
    
    console.log(`Search found ${data?.length || 0} results`);
    return data || [];
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
};

// Fetch customer points
export const getCustomerPoints = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('saldo_pontos')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching customer points:', error);
      return 0;
    }
    
    console.log('Customer points:', data?.saldo_pontos || 0);
    return data?.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCustomerPoints:', error);
    return 0;
  }
};

// Get point adjustments history for a customer
export const getPointAdjustments = async (userId: string): Promise<PointAdjustment[]> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    console.log(`Fetching point adjustments for user ${userId} from vendor ${vendorProfile.id}`);
    
    const { data, error } = await supabase
      .from('pontos_ajustados')
      .select('*')
      .eq('usuario_id', userId)
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching point adjustments:', error);
      return [];
    }
    
    console.log(`Found ${data.length} point adjustments`);
    return data as PointAdjustment[];
  } catch (error) {
    console.error('Error in getPointAdjustments:', error);
    return [];
  }
};

// Create a point adjustment
export const createPointAdjustment = async (
  userId: string, 
  tipo: 'adicao' | 'remocao', 
  valor: number, 
  motivo: string
): Promise<boolean> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return false;
    }
    
    console.log(`Creating ${tipo} point adjustment of ${valor} points for user ${userId}`);
    
    // Insert the adjustment record
    const { data, error } = await supabase
      .from('pontos_ajustados')
      .insert([
        {
          usuario_id: userId,
          vendedor_id: vendorProfile.id,
          tipo,
          valor,
          motivo
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating point adjustment:', error);
      return false;
    }
    
    // Update the user's points balance using the Supabase function that uses the DB function
    const { error: updateError } = await supabase.rpc('update_user_points', {
      user_id: userId,
      points_to_add: valor
    });
    
    if (updateError) {
      console.error('Error updating user points:', updateError);
      return false;
    }
    
    console.log('Point adjustment created successfully');
    return true;
  } catch (error) {
    console.error('Error in createPointAdjustment:', error);
    return false;
  }
};
