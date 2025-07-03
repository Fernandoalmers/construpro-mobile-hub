
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Filter, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserReviews } from '@/hooks/useUserReviews';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';


const ReviewsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  const { reviews, loading, error, refetch } = useUserReviews();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const filteredReviews = reviews.filter(review => {
    if (ratingFilter !== 'all' && review.avaliacao.toString() !== ratingFilter) {
      return false;
    }
    
    if (dateFilter !== 'all') {
      const reviewDate = new Date(review.data_avaliacao);
      const now = new Date();
      
      switch (dateFilter) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return reviewDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return reviewDate >= monthAgo;
        case '3months':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return reviewDate >= threeMonthsAgo;
        default:
          return true;
      }
    }
    
    return true;
  });

  if (loading) {
    return <LoadingState text="Carregando suas avaliações..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Erro ao carregar avaliações" 
        message={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-4 pt-12">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-2 mr-2 text-white hover:bg-white/20" 
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-white">Avaliações Feitas</h1>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="flex-1 bg-white">
              <SelectValue placeholder="Avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as avaliações</SelectItem>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4 estrelas</SelectItem>
              <SelectItem value="3">3 estrelas</SelectItem>
              <SelectItem value="2">2 estrelas</SelectItem>
              <SelectItem value="1">1 estrela</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="flex-1 bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-4 space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="p-6 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-lg mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-600 mb-4">
              {reviews.length === 0 
                ? "Você ainda não fez nenhuma avaliação."
                : "Nenhuma avaliação encontrada com os filtros aplicados."
              }
            </p>
            <Button onClick={() => navigate('/marketplace')}>
              Ir às compras
            </Button>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card 
              key={review.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/produto/${review.produto_id}`)}
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={24} className="text-gray-500" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{review.produto_nome}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {renderStars(review.avaliacao)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(review.data_avaliacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {review.comentario && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      "{review.comentario}"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsScreen;
