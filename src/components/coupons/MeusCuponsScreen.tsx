
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy, Check, Ticket, Tag, Calendar, Percent, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { fetchPromotionalCoupons, PromotionalCoupon, formatDiscount, formatExpiryDate } from '@/services/promotionalCouponsService';

const MeusCuponsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<PromotionalCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPromotionalCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading promotional coupons:', error);
      setError('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      toast.success(`Código ${code} copiado!`);
      
      setTimeout(() => {
        setCopiedCoupon(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying coupon:', error);
      toast.error('Erro ao copiar código');
    }
  };

  const handleGoToCart = () => {
    navigate('/carrinho');
  };

  if (loading) {
    return <LoadingState text="Carregando cupons..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Erro ao carregar cupons"
        message={error}
        onRetry={loadCoupons}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <Ticket className="h-6 w-6 text-orange-points mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">Meus Cupons</h1>
              </div>
            </div>
            <Button
              onClick={handleGoToCart}
              className="bg-orange-points hover:bg-orange-points/90 text-white"
            >
              Ir para Carrinho
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cupom disponível
            </h3>
            <p className="text-gray-500 mb-6">
              Não há cupons promocionais disponíveis no momento. Volte em breve!
            </p>
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
            >
              Voltar ao Início
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cupons Disponíveis
              </h2>
              <p className="text-gray-600">
                Copie os códigos abaixo e cole no seu carrinho para aplicar o desconto
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((promotionalCoupon) => {
                const { coupon } = promotionalCoupon;
                const isCopied = copiedCoupon === coupon.code;
                
                return (
                  <Card key={promotionalCoupon.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 bg-gradient-to-r from-orange-points to-orange-points/80 text-white">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-bold">{coupon.name}</span>
                        <div className="flex items-center text-sm">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="h-4 w-4 mr-1" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-1" />
                          )}
                          {formatDiscount(coupon.discount_type, coupon.discount_value)}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Código do Cupom */}
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500 mb-1">CÓDIGO</div>
                          <div className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                            {coupon.code}
                          </div>
                        </div>

                        {/* Descrição */}
                        {coupon.description && (
                          <p className="text-sm text-gray-600 text-center">
                            {coupon.description}
                          </p>
                        )}

                        {/* Informações */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Desconto:</span>
                            <span className="font-medium text-gray-900">
                              {formatDiscount(coupon.discount_type, coupon.discount_value)}
                            </span>
                          </div>
                          
                          {coupon.min_order_value > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Compra mínima:</span>
                              <span className="font-medium text-gray-900">
                                R$ {coupon.min_order_value.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Validade:
                            </span>
                            <span className="font-medium text-gray-900 text-xs">
                              {formatExpiryDate(coupon.expires_at)}
                            </span>
                          </div>

                          {coupon.max_uses && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Usos restantes:</span>
                              <span className="font-medium text-gray-900">
                                {Math.max(0, coupon.max_uses - coupon.used_count)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Botão Copiar */}
                        <Button
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className={`w-full transition-colors ${
                            isCopied 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-royal-blue hover:bg-royal-blue/90 text-white'
                          }`}
                          disabled={isCopied}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Código
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Como usar:</h3>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Copie o código do cupom desejado</li>
                <li>Adicione produtos ao seu carrinho</li>
                <li>No carrinho, cole o código no campo "Cupom de desconto"</li>
                <li>Clique em "Aplicar" para obter o desconto</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusCuponsScreen;
