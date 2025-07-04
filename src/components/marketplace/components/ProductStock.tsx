
import React from 'react';
import { Product } from '@/services/productService';

interface ProductStockProps {
  produto: Product;
}

const ProductStock: React.FC<ProductStockProps> = ({ produto }) => {
  return (
    <>
      <div className="text-sm text-gray-700 mt-1">
        {produto.estoque > 0 ? (
          <span className="text-green-700">
            Em estoque ({produto.estoque} {
              produto.unidade_medida && produto.unidade_medida !== 'unidade' 
                ? produto.unidade_medida.toLowerCase() 
                : produto.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'
            })
          </span>
        ) : (
          <span className="text-red-500">Fora de estoque</span>
        )}
      </div>
      
      {/* Unit of measurement note */}
      {produto.unidade_medida && produto.unidade_medida !== 'unidade' && (
        <div className="text-xs bg-yellow-50 p-2 rounded-md border border-yellow-100 mb-4">
          <span className="font-bold">Nota: </span>
          <span>Este produto é vendido por {produto.unidade_medida.toLowerCase()}</span>
          {produto.unidade_medida.toLowerCase().includes('m²') && (
            <span className="block mt-1">As quantidades serão ajustadas automaticamente para múltiplos da unidade de venda.</span>
          )}
          {produto.unidade_medida.toLowerCase().includes('barra') && (
            <span className="block mt-1">Pode ser vendido em meias barras (0.5).</span>
          )}
          {produto.unidade_medida.toLowerCase().includes('rolo') && (
            <span className="block mt-1">Vendido por metragem, permite quantidades fracionadas.</span>
          )}
          {(produto.unidade_medida.toLowerCase().includes('litro') || produto.unidade_medida.toLowerCase().includes('kg')) && (
            <span className="block mt-1">Permite quantidades decimais para maior precisão.</span>
          )}
        </div>
      )}
    </>
  );
};

export default ProductStock;
