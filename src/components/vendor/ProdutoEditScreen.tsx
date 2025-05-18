
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import ProductFormScreen from './ProductFormScreen';
import { getVendorProduct } from '@/services/vendorProductsService';
import LoadingState from '../common/LoadingState';

const ProdutoEditScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate('/vendor/products');
        return;
      }
      
      try {
        const productData = await getVendorProduct(id);
        console.log("[VendorProducts] getVendorProduct:", productData);
        
        if (!productData) {
          toast.error("Produto não encontrado", {
            description: "Não foi possível encontrar o produto solicitado"
          });
          navigate('/vendor/products');
          return;
        }
        
        // Add any missing fields with defaults before passing to the form
        const enhancedProductData = {
          ...productData,
          segmento: productData.segmento || ''  // Ensure segmento exists even if null/undefined
        };
        
        setProduct(enhancedProductData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error("Erro", {
          description: "Ocorreu um erro ao carregar os dados do produto"
        });
        navigate('/vendor/products');
      }
    };
    
    loadProduct();
  }, [id, navigate]);
  
  if (loading) {
    return <LoadingState text="Carregando produto..." />;
  }
  
  return <ProductFormScreen isEditing productId={id} initialData={product} />;
};

export default ProdutoEditScreen;
