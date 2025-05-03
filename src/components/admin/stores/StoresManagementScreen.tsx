
import React from 'react';
import AdminLayout from '../AdminLayout';
import { useAdminStores } from '@/hooks/useAdminStores';
import { useTitle } from '@/hooks/use-title';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoadingState from '@/components/common/LoadingState';

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'inativa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout currentSection="lojas">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gerenciar Lojas</h1>
        
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'pendente' ? 'default' : 'outline'}
              onClick={() => setFilter('pendente')}
            >
              Pendentes
            </Button>
            <Button
              variant={filter === 'ativa' ? 'default' : 'outline'}
              onClick={() => setFilter('ativa')}
            >
              Ativas
            </Button>
            <Button
              variant={filter === 'inativa' ? 'default' : 'outline'}
              onClick={() => setFilter('inativa')}
            >
              Inativas
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {store.logo_url && (
                          <img 
                            src={store.logo_url} 
                            alt={store.nome}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{store.nome}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[250px]">
                            {store.descricao || 'Sem descrição'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{store.owner_name}</TableCell>
                    <TableCell>{store.contato || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(store.status || 'pendente')}>
                        {store.status === 'ativa' ? 'Ativa' : 
                         store.status === 'pendente' ? 'Pendente' : 'Inativa'}
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
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => rejectStore(store.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {store.status === 'ativa' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => rejectStore(store.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {store.status === 'inativa' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={() => approveStore(store.id)}
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
