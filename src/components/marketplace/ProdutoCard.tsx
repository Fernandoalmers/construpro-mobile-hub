
import React from 'react';
import Card from '../common/Card';
import { ArrowUpRight } from 'lucide-react';

interface Produto {
  id: string;
  lojaId: string;
  nome: string;
  imagemUrl: string;
  preco: number;
  pontos: number;
  categoria: string;
}

interface Loja {
  id: string;
  nome: string;
  logoUrl: string;
  avaliacao: number;
}

interface ProdutoCardProps {
  produto: Produto;
  loja?: Loja;
  onClick?: () => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto, loja, onClick }) => {
  return (
    <Card className="overflow-hidden flex flex-col" onClick={onClick}>
      <div className="relative h-40 bg-gray-200">
        <img 
          src={produto.imagemUrl} 
          alt={produto.nome} 
          className="w-full h-full object-cover"
        />
        {loja && (
          <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm flex items-center gap-1">
            <img src={loja.logoUrl} alt={loja.nome} className="w-4 h-4 rounded-full object-cover" />
            {loja.nome}
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 mb-2">{produto.nome}</h3>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-lg font-bold text-construPro-blue">
              R$ {produto.preco.toFixed(2)}
            </p>
            <div className="bg-construPro-orange/10 text-construPro-orange rounded-full px-2 py-0.5 text-xs font-medium">
              {produto.pontos} pontos
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded">{produto.categoria}</span>
            <span className="ml-auto flex items-center text-construPro-blue">
              Ver detalhes <ArrowUpRight size={14} className="ml-1" />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProdutoCard;
