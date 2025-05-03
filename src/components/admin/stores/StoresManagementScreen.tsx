
import React from 'react';
import AdminLayout from '../AdminLayout';
import { useAdminStores } from '@/hooks/useAdminStores';
import { useTitle } from '@/hooks/use-title';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Check, X, Info, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LoadingState from '@/components/common/LoadingState';
import { getStoreBadgeColor } from '@/services/adminStoresService';

const StoresManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Lojas');
  
  const {
    stores,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    approveStore,
    rejectStore
  } = useAdminStores();

  return (
    <AdminLayout currentSection="lojas">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Gerenciar Lojas</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {stores.length} {stores.length === 1 ? 'loja' : 'lojas'} encontradas
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="min-w-24"
            >
              Todas
              {filter === 'all' && (
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {stores.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === 'pendente' ? 'default' : 'outline'}
              onClick={() => setFilter('pendente')}
              className="min-w-24"
            >
              Pendentes
              {filter === 'pendente' && (
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {stores.filter(store => store.status === 'pendente').length}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === 'ativa' ? 'default' : 'outline'}
              onClick={() => setFilter('ativa')}
              className="min-w-24"
            >
              Ativas
              {filter === 'ativa' && (
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {stores.filter(store => store.status === 'ativa').length}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === 'inativa' ? 'default' : 'outline'}
              onClick={() => setFilter('inativa')}
              className="min-w-24"
            >
              Inativas
              {filter === 'inativa' && (
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {stores.filter(store => store.status === 'inativa').length}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lojas..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          {loading ? (
            <div className="p-6">
              <LoadingState text="Carregando lojas..." />
            </div>
          ) : stores.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhuma loja encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
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
                      <Badge className={getStoreBadgeColor(store.status || 'pendente')}>
                        {store.status === 'ativa' ? 'Ativa' : 
                         store.status === 'pendente' ? 'Pendente' :
                         store.status === 'inativa' ? 'Inativa' : 
                         store.status === 'excluida' ? 'Excluída' : 'Desconhecido'}
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
                      {store.status === 'ativa' && (
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
                      {store.status === 'inativa' && (
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
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StoresManagementScreen;
