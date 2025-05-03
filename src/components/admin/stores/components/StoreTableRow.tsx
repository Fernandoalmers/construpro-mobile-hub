
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Info, ExternalLink } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStoreBadgeColor } from '@/services/admin/stores';
import { AdminStore } from '@/types/admin';

interface StoreTableRowProps {
  store: AdminStore;
  approveStore: (storeId: string) => void;
  rejectStore: (storeId: string) => void;
  getStatusDisplay: (status: string) => string;
}

const StoreTableRow: React.FC<StoreTableRowProps> = ({ 
  store, 
  approveStore, 
  rejectStore,
  getStatusDisplay
}) => {
  return (
    <TableRow key={store.id}>
      <TableCell>
        <div className="flex items-center space-x-3">
          {store.logo_url ? (
            <img 
              src={store.logo_url} 
              alt={store.nome}
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
              <span className="text-xs">Logo</span>
            </div>
          )}
          <div>
            <div className="font-medium">{store.nome}</div>
            <div className="text-xs text-gray-500 truncate max-w-[250px]">
              {store.descricao || 'Sem descrição'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>{store.proprietario_nome || 'Desconhecido'}</TableCell>
      <TableCell>{store.contato || 'N/A'}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <span>{store.produtos_count}</span>
                {store.produtos_count > 0 && (
                  <Info className="h-3 w-3 text-gray-400" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Esta loja tem {store.produtos_count} produtos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <Badge className={getStoreBadgeColor(store.status)}>
          {getStatusDisplay(store.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        {store.status === 'pendente' && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 text-green-600"
              onClick={() => approveStore(store.id)}
              title="Aprovar loja"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 text-red-600"
              onClick={() => rejectStore(store.id)}
              title="Rejeitar loja"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {(store.status === 'aprovado' || store.status === 'ativa') && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 text-blue-600"
              title="Ver detalhes"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 text-red-600"
              onClick={() => rejectStore(store.id)}
              title="Desativar loja"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {store.status === 'inativo' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-green-600"
            onClick={() => approveStore(store.id)}
            title="Reativar loja"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default StoreTableRow;
