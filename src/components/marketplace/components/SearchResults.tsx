
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResultsProps {
  searchResults: any[];
  showResults: boolean;
  onResultClick: (productId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  showResults,
  onResultClick
}) => {
  if (!showResults) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-20 mt-1 max-h-80 overflow-y-auto">
      {searchResults.map((product) => (
        <div
          key={product.id}
          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
          onClick={() => onResultClick(product.id)}
        >
          <div className="flex items-center">
            {product.imagem_url ? (
              <img 
                src={product.imagem_url} 
                alt={product.nome} 
                className="w-12 h-12 object-contain rounded-sm mr-3 bg-white border border-gray-200"
                onError={(e) => {
                  // If image fails to load, replace with placeholder
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                }}
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center rounded-sm mr-3 bg-gray-100 border border-gray-200 text-gray-400 text-xs">
                Sem imagem
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-2">{product.nome}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {product.stores?.nome || 'Loja'}
                </span>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-sm">
                    R$ {product.preco?.toFixed(2)}
                  </span>
                  {product.preco_anterior && product.preco_anterior > product.preco && (
                    <span className="text-xs text-gray-400 line-through">
                      R$ {product.preco_anterior?.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {searchResults.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  );
};

export default SearchResults;
