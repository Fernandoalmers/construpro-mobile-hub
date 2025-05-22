
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import ProductFormScreen from './ProductFormScreen';
import { getVendorProduct } from '@/services/vendorProductsService';
import LoadingState from '../common/LoadingState';
import { ArrowLeft } from 'lucide-react';

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
          nome: productData.nome || '',
          descricao: productData.descricao || '',
          segmento: productData.segmento || '',  // Ensure segmento exists even if null/undefined
          categoria: productData.categoria || '', // Ensure categoria exists even if null/undefined
          segmento_id: productData.segmento_id || null, // Preserve segment ID if available
          preco_normal: productData.preco_normal || 0,
          preco_promocional: productData.preco_promocional || null,
          pontos_consumidor: productData.pontos_consumidor || 0,
          pontos_profissional: productData.pontos_profissional || 0,
          estoque: productData.estoque || 0,
          marca: productData.marca || '',
          imagens: Array.isArray(productData.imagens) ? productData.imagens : []
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
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/products')} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Editar Produto</h1>
        </div>
        <div className="flex-1 flex justify-center items-center p-6">
          <LoadingState text="Carregando produto..." />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/products')} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Editar Produto</h1>
        </div>
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
      </div>
    );
  }
  
  return <ProductFormScreen isEditing productId={id} initialData={product} />;
};

export default ProdutoEditScreen;
