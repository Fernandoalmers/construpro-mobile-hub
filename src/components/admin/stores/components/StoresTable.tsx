
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow } from '@/components/ui/table';
import StoreTableRow from './StoreTableRow';
import { AdminStore } from '@/types/admin';

interface StoresTableProps {
  stores: AdminStore[];
  approveStore: (storeId: string) => void;
  rejectStore: (storeId: string) => void;
}

const StoresTable: React.FC<StoresTableProps> = ({ stores, approveStore, rejectStore }) => {
  // Helper function to map store status for display
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'aprovado': return 'Aprovado';
      case 'pendente': return 'Pendente';
      case 'inativo': return 'Inativo';
      case 'ativa': return 'Ativa';
      default: return status;
    }
  };

  return (
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
          <StoreTableRow 
            key={store.id} 
            store={store} 
            approveStore={approveStore} 
            rejectStore={rejectStore}
            getStatusDisplay={getStatusDisplay}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default StoresTable;
