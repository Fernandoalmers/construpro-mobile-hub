
import React, { useState } from 'react';
import { Truck, Shield, Star, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductDetailsProps {
  description: string;
  reviews?: {
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  canReview?: boolean;
  onAddReview?: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  description, 
  reviews = [], 
  canReview = false,
  onAddReview
}) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  return (
    <>
      {/* Description Section */}
      <Card className="mt-6">
        <CardContent className="p-0">
          <button 
            className="flex items-center justify-between w-full p-6 text-left"
            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
          >
            <h2 className="text-xl font-bold">Descrição do Produto</h2>
            {descriptionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {descriptionExpanded && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <p className="text-gray-700 whitespace-pre-line">
                {description || 'Sem descrição disponível para este produto.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Reviews Section */}
      <Card className="mt-4">
        <CardContent className="p-0">
          <button 
            className="flex items-center justify-between w-full p-6 text-left"
            onClick={() => setReviewsExpanded(!reviewsExpanded)}
          >
            <div className="flex items-center">
              <h2 className="text-xl font-bold">Avaliações</h2>
              <div className="flex items-center ml-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 text-sm">({reviews.length || 0})</span>
              </div>
            </div>
            {reviewsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {reviewsExpanded && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {reviews.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{review.user_name}</span>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">Ainda não há avaliações para este produto</p>
                  
                  {canReview && onAddReview && (
                    <Button onClick={onAddReview} variant="outline">
                      Seja o primeiro a avaliar
                    </Button>
                  )}
                </div>
              )}
              
              {canReview && reviews.length > 0 && onAddReview && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onAddReview}
                  >
                    Escrever uma avaliação
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Store info & policies */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="mr-4 bg-blue-100 p-3 rounded-full">
              <Truck className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Entrega rápida</h3>
              <p className="text-xs text-gray-600">Enviamos para Capelinha/MG e cidades vizinhas com entrega realizada por parceiros locais mais próximos.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="mr-4 bg-blue-100 p-3 rounded-full">
              <Shield className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Compra Garantida</h3>
              <p className="text-xs text-gray-600">Pague na entrega do produto</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="mr-4 bg-blue-100 p-3 rounded-full">
              <Star className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Ganhe Pontos</h3>
              <p className="text-xs text-gray-600">Acumule e troque por recompensas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProductDetails;
