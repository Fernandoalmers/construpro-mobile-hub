
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import VendorLayout from '@/layouts/VendorLayout';
import ProductForm from '@/components/vendor/ProductForm';
import { getProductById } from '@/services/vendorProductService';
import { toast } from '@/components/ui/use-toast';

const ProductFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(!!id);
  const [productData, setProductData] = useState<any>(null);
  
  // If this is a duplicate product, it will come from location state
  const duplicatedProduct = location.state?.initialData;

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const product = await getProductById(id);
        if (product) {
          setProductData(product);
        } else {
          toast({
            title: "Produto não encontrado",
            description: "O produto solicitado não foi encontrado ou você não tem permissão para acessá-lo.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as informações do produto.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [id]);
  
  return (
    <VendorLayout>
      <div className="container mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-t-construPro-blue rounded-full animate-spin"></div>
            <span className="ml-2">Carregando produto...</span>
          </div>
        ) : (
          <ProductForm 
            productId={id} 
            initialData={id ? productData : duplicatedProduct}
          />
        )}
      </div>
    </VendorLayout>
  );
};

export default ProductFormPage;
