
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '../../adminService';

/**
 * Approve a product
 */
export const approveProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('Approving product:', productId);
    // Try updating in produtos table first
    let { error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) {
      console.log('Error updating in produtos, trying products table:', error);
      // Try updating in products table if produtos fails
      const { error: productsError } = await supabase
        .from('products')
        .update({ status: 'aprovado', updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (productsError) {
        console.error('Error approving product in both tables:', productsError);
        throw productsError;
      }
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'aprovado' }
    });
    
    toast.success('Produto aprovado com sucesso');
    return true;
  } catch (error) {
    console.error('Error approving product:', error);
    toast.error('Erro ao aprovar produto');
    return false;
  }
};

/**
 * Reject a product
 */
export const rejectProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('Rejecting product:', productId);
    // Try updating in produtos table first
    let { error } = await supabase
      .from('produtos')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) {
      console.log('Error updating in produtos, trying products table:', error);
      // Try updating in products table if produtos fails
      const { error: productsError } = await supabase
        .from('products')
        .update({ status: 'inativo', updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (productsError) {
        console.error('Error rejecting product in both tables:', productsError);
        throw productsError;
      }
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'inativo' }
    });
    
    toast.success('Produto rejeitado com sucesso');
    return true;
  } catch (error) {
    console.error('Error rejecting product:', error);
    toast.error('Erro ao rejeitar produto');
    return false;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    // Try deleting from produtos table first
    let { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);
      
    if (error) {
      // Try deleting from products table if produtos fails
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (productsError) {
        console.error('Error deleting product from both tables:', productsError);
        throw productsError;
      }
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_product',
      entityType: 'produto',
      entityId: productId,
      details: { action: 'delete' }
    });
    
    toast.success('Produto excluído com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error('Erro ao excluir produto');
    return false;
  }
};
