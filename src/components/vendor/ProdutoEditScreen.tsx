
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
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        toast.error("ID do produto não fornecido", {
          description: "Não foi possível identificar qual produto editar"
        });
        navigate('/vendor/products');
        return;
      }
      
      try {
        console.log("[ProdutoEditScreen] Loading product with ID:", id);
        setLoading(true);
        setError(null);
        
        const productData = await getVendorProduct(id);
        console.log("[ProdutoEditScreen] getVendorProduct response:", productData);
        
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
          segmento: productData.segmento || '',  // Ensure segmento exists even if null/undefined
          categoria: productData.categoria || '', // Ensure categoria exists even if null/undefined
          segmento_id: productData.segmento_id || null, // Preserve segment ID if available
        };
        
        console.log("[ProdutoEditScreen] Enhanced product data:", enhancedProductData);
        
        setProduct(enhancedProductData);
        setLoading(false);
      } catch (error) {
        console.error('[ProdutoEditScreen] Error loading product:', error);
        setError(`Erro ao carregar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        toast.error("Erro", {
          description: "Ocorreu um erro ao carregar os dados do produto"
        });
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [id, navigate]);
  
  if (loading) {
    return <LoadingState text="Carregando produto..." />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Erro ao carregar produto</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => navigate('/vendor/products')}
        >
          Voltar para produtos
        </button>
      </div>
    );
  }
  
  return <ProductFormScreen isEditing productId={id} initialData={product} />;
};

export default ProdutoEditScreen;
