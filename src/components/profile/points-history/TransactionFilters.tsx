
import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionFiltersProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  originFilter: string;
  setOriginFilter: (origin: string) => void;
  periodFilter: string;
  setPeriodFilter: (period: string) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  showFilters,
  setShowFilters,
  typeFilter,
  setTypeFilter,
  originFilter,
  setOriginFilter,
  periodFilter,
  setPeriodFilter,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Extrato de pontos</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} className="mr-1" />
          Filtros
        </Button>
      </div>
      
      {showFilters && (
        <div className="bg-gray-50 p-3 rounded-md mb-4 space-y-3">
          <div className="flex gap-3 mb-1">
            <Select defaultValue={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ganho">Ganhos</SelectItem>
                <SelectItem value="resgate">Resgates</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas origens</SelectItem>
                <SelectItem value="compra">Compras app</SelectItem>
                <SelectItem value="loja-fisica">Compras físicas</SelectItem>
                <SelectItem value="servico">Serviços</SelectItem>
                <SelectItem value="indicacao">Indicações</SelectItem>
                <SelectItem value="resgate">Resgates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select defaultValue={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo período</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="90dias">Últimos 90 dias</SelectItem>
              <SelectItem value="6meses">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};

export default TransactionFilters;
