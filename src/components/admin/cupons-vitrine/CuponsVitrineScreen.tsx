
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import AdminLayout from '../AdminLayout';
import LoadingState from '@/components/common/LoadingState';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CupomVitrine, fetchCuponsVitrine, toggleShowInVitrine } from '@/services/cuponsVitrineService';

const CuponsVitrineScreen: React.FC = () => {
  const [cupons, setCupons] = useState<CupomVitrine[]>([]);
  const [filteredCupons, setFilteredCupons] = useState<CupomVitrine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadCupons();
  }, []);

  useEffect(() => {
    filterCupons();
  }, [cupons, searchTerm]);

  const loadCupons = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCuponsVitrine();
      setCupons(data);
    } catch (error) {
      console.error('Error loading cupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCupons = () => {
    if (!searchTerm.trim()) {
      setFilteredCupons(cupons);
      return;
    }

    const filtered = cupons.filter(cupom =>
      cupom.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cupom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cupom.description && cupom.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCupons(filtered);
    setCurrentPage(1);
  };

  const handleToggleVitrine = async (cupomId: string, currentValue: boolean) => {
    const success = await toggleShowInVitrine(cupomId, !currentValue);
    if (success) {
      setCupons(prev => 
        prev.map(cupom => 
          cupom.id === cupomId 
            ? { ...cupom, show_in_vitrine: !currentValue }
            : cupom
        )
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem expiração';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `R$ ${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <AdminLayout currentSection="cupons-vitrine">
        <LoadingState text="Carregando cupons..." />
      </AdminLayout>
    );
  }

  const totalPages = Math.ceil(filteredCupons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCupons = filteredCupons.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout currentSection="cupons-vitrine">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupons Vitrine</h1>
            <p className="text-gray-600">Gerencie quais cupons aparecem na vitrine para usuários</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar cupons por código, nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{cupons.length}</div>
            <div className="text-sm text-gray-600">Total de Cupons</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {cupons.filter(c => c.show_in_vitrine).length}
            </div>
            <div className="text-sm text-gray-600">Na Vitrine</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {cupons.filter(c => c.active && c.show_in_vitrine).length}
            </div>
            <div className="text-sm text-gray-600">Ativos na Vitrine</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vitrine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCupons.map((cupom) => (
                <TableRow key={cupom.id}>
                  <TableCell className="font-mono font-medium">{cupom.code}</TableCell>
                  <TableCell>{cupom.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {cupom.description || '-'}
                  </TableCell>
                  <TableCell>{formatDiscount(cupom.discount_type, cupom.discount_value)}</TableCell>
                  <TableCell>{formatDate(cupom.expires_at)}</TableCell>
                  <TableCell>
                    <Badge variant={cupom.active ? 'default' : 'secondary'}>
                      {cupom.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cupom.show_in_vitrine}
                      onCheckedChange={() => handleToggleVitrine(cupom.id, cupom.show_in_vitrine)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredCupons.length)} de {filteredCupons.length} cupons
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CuponsVitrineScreen;
