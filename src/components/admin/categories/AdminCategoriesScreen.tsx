
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Category {
  id: string;
  nome: string;
  segmento_id?: string;
  segmento_nome?: string;
  produtos_count: number;
  created_at: string;
}

interface Segment {
  id: string;
  nome: string;
  categorias_count: number;
  created_at: string;
}

const AdminCategoriesScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Categorias');
  const [categories, setCategories] = useState<Category[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('categories');

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      // First try to get from product_categories table (new structure)
      let { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select(`
          id,
          nome,
          segmento_id,
          product_segments(nome)
        `)
        .order('nome');

      if (categoriesError) {
        console.error('Error fetching from product_categories:', categoriesError);
        // Fallback to get unique categories from produtos table (old structure)
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('categoria')
          .order('categoria');

        if (produtosError) throw produtosError;

        // Count occurrences of each category
        const categoryCounts = produtosData.reduce((acc: Record<string, number>, curr) => {
          if (curr.categoria) {
            acc[curr.categoria] = (acc[curr.categoria] || 0) + 1;
          }
          return acc;
        }, {});

        // Transform to expected format
        categoriesData = Object.entries(categoryCounts).map(([nome, count]) => ({
          id: nome, // Use category name as ID for these legacy categories
          nome,
          produtos_count: count,
          created_at: new Date().toISOString(),
          segmento_id: null,
          segmento_nome: null
        }));
      } else {
        // Count products for each category
        const { data: countsData } = await supabase
          .from('produtos')
          .select('categoria, count')
          .order('categoria')
          .group('categoria');

        const countMap = (countsData || []).reduce((acc: Record<string, number>, curr) => {
          acc[curr.categoria] = curr.count;
          return acc;
        }, {});

        // Format categories data
        categoriesData = categoriesData.map(cat => ({
          id: cat.id,
          nome: cat.nome,
          segmento_id: cat.segmento_id,
          segmento_nome: cat.product_segments?.nome,
          produtos_count: countMap[cat.nome] || 0,
          created_at: cat.created_at || new Date().toISOString()
        }));
      }

      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao buscar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch segments from Supabase
  const fetchSegments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_segments')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }

      // Count categories in each segment
      const segmentsWithCounts = await Promise.all(
        (data || []).map(async (segment) => {
          const { count } = await supabase
            .from('product_categories')
            .select('id', { count: 'exact', head: true })
            .eq('segmento_id', segment.id);

          return {
            ...segment,
            categorias_count: count || 0
          };
        })
      );

      setSegments(segmentsWithCounts);
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    } else {
      fetchSegments();
    }
  }, [activeTab]);

  const filteredCategories = categories.filter(cat =>
    cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.segmento_nome && cat.segmento_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSegments = segments.filter(seg =>
    seg.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout currentSection="categorias">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Categorias & Segmentos</h2>
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> 
            {activeTab === 'categories' ? 'Nova Categoria' : 'Novo Segmento'}
          </Button>
        </div>

        <Tabs defaultValue="categories" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="segments">Segmentos</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="relative flex items-center">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${activeTab === 'categories' ? 'categorias' : 'segmentos'}...`}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingState text="Carregando categorias..." />
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhuma categoria encontrada.' : 'Não há categorias cadastradas.'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Segmento</TableHead>
                        <TableHead>Total de Produtos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.nome}</TableCell>
                          <TableCell>{category.segmento_nome || 'N/A'}</TableCell>
                          <TableCell>{category.produtos_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Segmentos de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingState text="Carregando segmentos..." />
                ) : filteredSegments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhum segmento encontrado.' : 'Não há segmentos cadastrados.'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Total de Categorias</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSegments.map((segment) => (
                        <TableRow key={segment.id}>
                          <TableCell className="font-medium">{segment.nome}</TableCell>
                          <TableCell>{segment.categorias_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesScreen;
