
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Plus, Search, Edit, Trash, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomModal from '@/components/common/CustomModal';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import SegmentForm from '@/components/admin/categories/SegmentForm';
import { Badge } from '@/components/ui/badge';
import {
  fetchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  getCategoryStatusBadgeColor
} from '@/services/admin/categories';
import {
  getProductSegments,
  createProductSegment,
  updateProductSegment,
  deleteProductSegment,
  ProductSegment
} from '@/services/admin/productSegmentsService';

// Define types aligned with the actual data structure
interface AdminCategory {
  id: string;
  nome: string;
  segmento_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  segment_name?: string;
  produtos_count: number;
}

interface AdminSegment {
  id: string;
  nome: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  categorias_count: number;
}

const AdminCategoriesScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Categorias');
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [segments, setSegments] = useState<AdminSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  
  // Modal states
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createSegmentModalOpen, setCreateSegmentModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [editSegmentModalOpen, setEditSegmentModalOpen] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [deleteSegmentModalOpen, setDeleteSegmentModalOpen] = useState(false);
  
  // Selected items for editing/deleting
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<AdminSegment | null>(null);
  
  // Loading states for form submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories from Supabase
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await fetchProductCategories();
      // Transform to match AdminCategory interface
      const transformedData: AdminCategory[] = categoriesData.map(cat => ({
        ...cat,
        produtos_count: cat.produtos_count || 0
      }));
      setCategories(transformedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao buscar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch segments from Supabase
  const loadSegments = async () => {
    try {
      setIsLoading(true);
      const segmentsData = await getProductSegments();
      // Transform to match AdminSegment interface
      const transformedData: AdminSegment[] = segmentsData.map(seg => ({
        ...seg,
        created_at: seg.created_at || new Date().toISOString(),
        updated_at: seg.updated_at || new Date().toISOString(),
        categorias_count: seg.categorias_count || 0
      }));
      setSegments(transformedData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    } else {
      loadSegments();
    }
  }, [activeTab]);

  const filteredCategories = categories.filter(cat =>
    cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.segment_name && cat.segment_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSegments = segments.filter(seg =>
    seg.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler for creating a new category
  const handleCreateCategory = async (data: {
    nome: string;
    segmento_id: string;
    status: string;
  }) => {
    setIsSubmitting(true);
    try {
      const success = await createProductCategory(data);
      if (success) {
        setCreateCategoryModalOpen(false);
        await loadCategories();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for creating a new segment
  const handleCreateSegment = async (
    data: {
      nome: string;
      status: string;
      image_url?: string | null;
    },
    imageFile?: File
  ) => {
    setIsSubmitting(true);
    try {
      const success = await createProductSegment(data, imageFile);
      if (success) {
        setCreateSegmentModalOpen(false);
        await loadSegments();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating a category
  const handleUpdateCategory = async (data: {
    nome: string;
    segmento_id: string;
    status: string;
  }) => {
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      const success = await updateProductCategory(selectedCategory.id, data);
      if (success) {
        setEditCategoryModalOpen(false);
        await loadCategories();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating a segment
  const handleUpdateSegment = async (
    data: {
      nome: string;
      status: string;
      image_url?: string | null;
    },
    imageFile?: File
  ) => {
    if (!selectedSegment) return;
    
    setIsSubmitting(true);
    try {
      const success = await updateProductSegment(selectedSegment.id, data, imageFile);
      if (success) {
        setEditSegmentModalOpen(false);
        await loadSegments();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for deleting a category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteProductCategory(selectedCategory.id);
      if (success) {
        setDeleteCategoryModalOpen(false);
        await loadCategories();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for deleting a segment
  const handleDeleteSegment = async () => {
    if (!selectedSegment) return;
    
    setIsSubmitting(true);
    try {
      const success = await deleteProductSegment(selectedSegment.id);
      if (success) {
        setDeleteSegmentModalOpen(false);
        await loadSegments();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout currentSection="categorias">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Categorias & Segmentos</h2>
          <Button 
            className="flex items-center gap-1" 
            onClick={() => activeTab === 'categories' 
              ? setCreateCategoryModalOpen(true) 
              : setCreateSegmentModalOpen(true)
            }
          >
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
                        <TableHead>Status</TableHead>
                        <TableHead>Total de Produtos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.nome}</TableCell>
                          <TableCell>{category.segment_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getCategoryStatusBadgeColor(category.status)}>
                              {category.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{category.produtos_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setEditCategoryModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setDeleteCategoryModalOpen(true);
                                }}
                              >
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
                        <TableHead>Imagem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total de Categorias</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSegments.map((segment) => (
                        <TableRow key={segment.id}>
                          <TableCell className="font-medium">{segment.nome}</TableCell>
                          <TableCell>
                            {segment.image_url ? (
                              <div className="h-10 w-16 relative rounded-md overflow-hidden">
                                <img 
                                  src={segment.image_url} 
                                  alt={segment.nome}
                                  className="h-full w-full object-cover" 
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-16 bg-gray-200 rounded-md flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryStatusBadgeColor(segment.status)}>
                              {segment.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{segment.categorias_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedSegment(segment);
                                  setEditSegmentModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setSelectedSegment(segment);
                                  setDeleteSegmentModalOpen(true);
                                }}
                              >
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

      {/* Create Category Modal */}
      <CustomModal
        open={createCategoryModalOpen}
        onOpenChange={setCreateCategoryModalOpen}
        title="Nova Categoria"
        description="Adicione uma nova categoria de produtos"
      >
        <CategoryForm 
          onSubmit={handleCreateCategory}
          isLoading={isSubmitting}
        />
      </CustomModal>

      {/* Create Segment Modal */}
      <CustomModal
        open={createSegmentModalOpen}
        onOpenChange={setCreateSegmentModalOpen}
        title="Novo Segmento"
        description="Adicione um novo segmento de produtos"
      >
        <SegmentForm 
          onSubmit={handleCreateSegment}
          isLoading={isSubmitting}
        />
      </CustomModal>

      {/* Edit Category Modal */}
      <CustomModal
        open={editCategoryModalOpen}
        onOpenChange={setEditCategoryModalOpen}
        title="Editar Categoria"
        description="Atualize os dados da categoria selecionada"
      >
        {selectedCategory && (
          <CategoryForm 
            initialData={{
              id: selectedCategory.id,
              nome: selectedCategory.nome,
              segmento_id: selectedCategory.segmento_id,
              status: selectedCategory.status
            }}
            onSubmit={handleUpdateCategory}
            isLoading={isSubmitting}
          />
        )}
      </CustomModal>

      {/* Edit Segment Modal */}
      <CustomModal
        open={editSegmentModalOpen}
        onOpenChange={setEditSegmentModalOpen}
        title="Editar Segmento"
        description="Atualize os dados do segmento selecionado"
      >
        {selectedSegment && (
          <SegmentForm 
            initialData={{
              id: selectedSegment.id,
              nome: selectedSegment.nome,
              status: selectedSegment.status,
              image_url: selectedSegment.image_url
            }}
            onSubmit={handleUpdateSegment}
            isLoading={isSubmitting}
          />
        )}
      </CustomModal>

      {/* Delete Category Confirmation Modal */}
      <CustomModal
        open={deleteCategoryModalOpen}
        onOpenChange={setDeleteCategoryModalOpen}
        title="Excluir Categoria"
        size="sm"
        showFooterButtons
        onConfirm={handleDeleteCategory}
        confirmText="Excluir"
        onCancel={() => setDeleteCategoryModalOpen(false)}
        cancelText="Cancelar"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-gray-600">
              Você tem certeza que deseja excluir a categoria 
              <span className="font-semibold"> {selectedCategory?.nome}</span>?
            </p>
            <p className="text-sm text-red-500 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
      </CustomModal>

      {/* Delete Segment Confirmation Modal */}
      <CustomModal
        open={deleteSegmentModalOpen}
        onOpenChange={setDeleteSegmentModalOpen}
        title="Excluir Segmento"
        size="sm"
        showFooterButtons
        onConfirm={handleDeleteSegment}
        confirmText="Excluir"
        onCancel={() => setDeleteSegmentModalOpen(false)}
        cancelText="Cancelar"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-gray-600">
              Você tem certeza que deseja excluir o segmento 
              <span className="font-semibold"> {selectedSegment?.nome}</span>?
            </p>
            <p className="text-sm text-red-500 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
};

export default AdminCategoriesScreen;
