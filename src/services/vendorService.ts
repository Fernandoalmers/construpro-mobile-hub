
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Types
export interface Vendor {
  id: string;
  usuario_id: string;
  nome_loja: string;
  logo?: string;
  banner?: string;
  segmento?: string;
  descricao?: string;
  formas_entrega?: string[];
  telefone?: string;
  whatsapp?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorProduct {
  id: string;
  vendedor_id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number;
  estoque: number;
  codigo_barras?: string;
  sku?: string;
  segmento?: string;
  categoria: string;
  pontos_profissional: number;
  pontos_consumidor: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

export interface VendorOrder {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  data_entrega_estimada?: string;
  cliente?: VendorCustomer;
  itens?: OrderItem[];
}

export interface OrderItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  created_at?: string;
  produto?: VendorProduct;
}

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
}

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

// Vendor Store Management
export const getVendorProfile = async (): Promise<Vendor | null> => {
  try {
    // Get auth user id
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('usuario_id', user.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching vendor:', error);
      return null;
    }
    
    return data as Vendor;
  } catch (error) {
    console.error('Error in getVendorProfile:', error);
    return null;
  }
};

export const saveVendorProfile = async (vendorData: Partial<Vendor>): Promise<Vendor | null> => {
  try {
    // Get auth user id
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      return null;
    }
    
    // Check if vendor profile exists
    const { data: existingVendor } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.user.id)
      .single();
    
    let result;
    
    if (existingVendor) {
      // Update existing vendor
      const { data, error } = await supabase
        .from('vendedores')
        .update(vendorData)
        .eq('id', existingVendor.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new vendor - ensure nome_loja is provided
      if (!vendorData.nome_loja) {
        throw new Error('Nome da loja é obrigatório');
      }
      
      // Make sure we're providing a nome_loja value when creating a new vendor
      const newVendor = {
        ...vendorData,
        nome_loja: vendorData.nome_loja,
        usuario_id: user.user.id
      };
      
      const { data, error } = await supabase
        .from('vendedores')
        .insert(newVendor)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return result as Vendor;
  } catch (error) {
    console.error('Error saving vendor profile:', error);
    toast.error('Erro ao salvar dados da loja');
    return null;
  }
};

// Vendor Products Management
export const getVendorProducts = async (): Promise<VendorProduct[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching vendor products:', error);
      return [];
    }
    
    return data as VendorProduct[];
  } catch (error) {
    console.error('Error in getVendorProducts:', error);
    return [];
  }
};

export const getVendorProduct = async (id: string): Promise<VendorProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data as VendorProduct;
  } catch (error) {
    console.error('Error in getVendorProduct:', error);
    return null;
  }
};

export const saveVendorProduct = async (product: Partial<VendorProduct>): Promise<VendorProduct | null> => {
  try {
    // Get vendor profile
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    // Set vendor_id
    const vendorProduct = {
      ...product,
      vendedor_id: vendorProfile.id
    };
    
    let result;
    
    if (product.id) {
      // Update existing product
      const { data, error } = await supabase
        .from('produtos')
        .update(vendorProduct)
        .eq('id', product.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new product - make sure required fields are provided
      if (!product.nome || !product.descricao || !product.categoria) {
        throw new Error('Nome, descrição e categoria são obrigatórios');
      }
      
      const newProduct = {
        ...vendorProduct,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal || 0,
        status: 'pendente'
      };
      
      const { data, error } = await supabase
        .from('produtos')
        .insert(newProduct)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return result as VendorProduct;
  } catch (error) {
    console.error('Error saving product:', error);
    toast.error('Erro ao salvar produto');
    return null;
  }
};

export const deleteVendorProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error('Erro ao excluir produto');
    return false;
  }
};

export const updateProductStatus = async (id: string, status: 'pendente' | 'aprovado' | 'inativo'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating product status:', error);
    toast.error('Erro ao atualizar status do produto');
    return false;
  }
};

// Vendor Orders Management
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    // Query orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('pedidos')
      .select(`
        *,
        cliente:usuario_id (
          id,
          nome,
          email,
          telefone
        )
      `)
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching vendor orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      return [];
    }

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const { data: itemsData, error: itemsError } = await supabase
          .from('itens_pedido')
          .select(`
            *,
            produto:produto_id (*)
          `)
          .eq('pedido_id', order.id);
        
        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          return { 
            ...order, 
            itens: [],
            // Safely handle potentially missing cliente data
            cliente: order.cliente && typeof order.cliente === 'object' ? {
              id: order.cliente.id || '',
              vendedor_id: vendorProfile.id,
              usuario_id: order.usuario_id,
              nome: order.cliente.nome || 'Cliente',
              telefone: order.cliente.telefone,
              email: order.cliente.email,
              total_gasto: 0
            } : undefined
          };
        }
        
        return { 
          ...order, 
          itens: itemsData || [],
          // Safely handle potentially missing cliente data
          cliente: order.cliente && typeof order.cliente === 'object' ? {
            id: order.cliente.id || '',
            vendedor_id: vendorProfile.id,
            usuario_id: order.usuario_id,
            nome: order.cliente.nome || 'Cliente',
            telefone: order.cliente.telefone,
            email: order.cliente.email,
            total_gasto: 0
          } : undefined
        };
      })
    );
    
    return ordersWithItems as VendorOrder[];
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};

// Vendor Customers Management
export const getVendorCustomers = async (): Promise<VendorCustomer[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .order('total_gasto', { ascending: false });
    
    if (error) {
      console.error('Error fetching vendor customers:', error);
      return [];
    }
    
    return data as VendorCustomer[];
  } catch (error) {
    console.error('Error in getVendorCustomers:', error);
    return [];
  }
};

export const getVendorCustomer = async (userId: string): Promise<VendorCustomer | null> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .eq('usuario_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
    
    return data as VendorCustomer;
  } catch (error) {
    console.error('Error in getVendorCustomer:', error);
    return null;
  }
};

// Points Adjustment Management
export const getPointAdjustments = async (userId?: string): Promise<PointAdjustment[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
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

    // Safely process the data handling potential errors with cliente data
    const safeAdjustments = data.map(item => ({
      ...item,
      cliente: item.cliente && typeof item.cliente === 'object' ? {
        id: item.cliente.id || '',
        vendedor_id: vendorProfile.id,
        usuario_id: item.usuario_id,
        nome: item.cliente.nome || 'Cliente',
        telefone: item.cliente.telefone,
        email: item.cliente.email,
        total_gasto: 0
      } : undefined
    }));
    
    return safeAdjustments as PointAdjustment[];
  } catch (error) {
    console.error('Error in getPointAdjustments:', error);
    return [];
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
    
    const { error } = await supabase
      .from('pontos_ajustados')
      .insert({
        vendedor_id: vendorProfile.id,
        usuario_id: userId,
        tipo,
        valor,
        motivo
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating point adjustment:', error);
    toast.error('Erro ao ajustar pontos');
    return false;
  }
};

// File Upload Helpers
export const uploadVendorImage = async (
  file: File,
  folder: string,
  fileName: string
): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const filePath = `${folder}/${vendorProfile.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadVendorImage:', error);
    return null;
  }
};

export const uploadProductImage = async (
  productId: string,
  file: File,
  index = 0
): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const fileName = `${index}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `products/${vendorProfile.id}/${productId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading product image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    return null;
  }
};

// Fetch customer points
export const getCustomerPoints = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('saldo_pontos')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching customer points:', error);
      return 0;
    }
    
    return data.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCustomerPoints:', error);
    return 0;
  }
};

// Search for customers by name, email, or phone
export const searchCustomers = async (searchTerm: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(10);
    
    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
};
