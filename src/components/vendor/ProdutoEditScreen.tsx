
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import ProductFormScreen from './ProductFormScreen';
import { getVendorProduct } from '@/services/vendorService';
import LoadingState from '../common/LoadingState';

const ProdutoEditScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate('/vendor/products');
        return;
      }
      
      try {
        const product = await getVendorProduct(id);
        if (!product) {
          toast("Produto não encontrado", {
            description: "Não foi possível encontrar o produto solicitado",
            variant: "destructive"
          });
          navigate('/vendor/products');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading product:', error);
        toast("Erro", {
          description: "Ocorreu um erro ao carregar os dados do produto",
          variant: "destructive"
        });
        navigate('/vendor/products');
      }
    };
    
    loadProduct();
  }, [id, navigate]);
  
  if (loading) {
    return <LoadingState text="Carregando produto..." />;
  }
  
  return <ProductFormScreen isEditing productId={id} />;
};

export default ProdutoEditScreen;
