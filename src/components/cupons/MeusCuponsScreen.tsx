
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, Calendar, Percent, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CupomVitrine, fetchCuponsPublicos, createSampleCupons } from '@/services/cuponsVitrineService';

const MeusCuponsScreenContent: React.FC = () => {
  const [cupons, setCupons] = useState<CupomVitrine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);

  useEffect(() => {
    console.log('🔄 [MeusCuponsScreen] Component mounted, loading cupons...');
    loadCupons();
  }, []);

  const loadCupons = async () => {
    console.log('🔄 [MeusCuponsScreen] Starting to load cupons...');
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchCuponsPublicos();
      console.log(`✅ [MeusCuponsScreen] Loaded ${data.length} cupons:`, data);
      setCupons(data);
      
      if (data.length === 0) {
        console.log('⚠️ [MeusCuponsScreen] No cupons found, user might need sample data');
      }
    } catch (error) {
      console.error('❌ [MeusCuponsScreen] Error loading cupons:', error);
      setError('Erro ao carregar cupons. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSamples = async () => {
    console.log('🔄 [MeusCuponsScreen] Creating sample cupons...');
    setIsCreatingSamples(true);
    
    try {
      const success = await createSampleCupons();
      if (success) {
        toast.success('Cupons de exemplo criados com sucesso!');
        await loadCupons(); // Recarregar a lista
      } else {
        toast.error('Erro ao criar cupons de exemplo');
      }
    } catch (error) {
      console.error('❌ [MeusCuponsScreen] Error creating samples:', error);
      toast.error('Erro ao criar cupons de exemplo');
    } finally {
      setIsCreatingSamples(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Código copiado! Cole no carrinho para aplicar.');
    } catch (error) {
      console.error('❌ [MeusCuponsScreen] Error copying code:', error);
      toast.error('Erro ao copiar código');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem expiração';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `R$ ${value.toFixed(2)}`;
  };

  const getDiscountIcon = (type: string) => {
    return type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />;
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-gray-100 min-h-screen pb-20">
        <div className="p-6 pt-12">
          <LoadingState text="Carregando cupons..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-gray-100 min-h-screen pb-20">
        <div className="p-6 pt-12">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erro ao carregar cupons
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={loadCupons} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen pb-20">
      {/* Header */}
      <div className="p-6 pt-12 bg-construPro-blue rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="h-8 w-8 text-white" />
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Cupons</h1>
            <p className="text-white text-opacity-80">Copie os códigos e use no carrinho</p>
          </div>
        </div>
      </div>

      <div className="p-6 -mt-6">
        {cupons.length === 0 ? (
          /* Empty State */
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <Gift className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum cupom disponível no momento
                </h3>
                <p className="text-gray-600 mb-4">
                  Volte em breve para conferir novas ofertas!
                </p>
                <Button 
                  onClick={handleCreateSamples}
                  disabled={isCreatingSamples}
                  className="gap-2"
                >
                  <Gift className="h-4 w-4" />
                  {isCreatingSamples ? 'Criando...' : 'Criar cupons de exemplo'}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Cupons List */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {cupons.length} cupom{cupons.length !== 1 ? 's' : ''} disponível{cupons.length !== 1 ? 'eis' : ''}
              </p>
              <Button variant="outline" size="sm" onClick={loadCupons} className="gap-2">
                <RefreshCw className="h-3 w-3" />
                Atualizar
              </Button>
            </div>
            
            {cupons.map((cupom) => (
              <Card key={cupom.id} className={`${isExpired(cupom.expires_at) ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cupom.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {cupom.description || 'Cupom de desconto'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-construPro-orange">
                      {getDiscountIcon(cupom.discount_type)}
                      <span className="font-bold text-lg">
                        {formatDiscount(cupom.discount_type, cupom.discount_value)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Válido até {formatDate(cupom.expires_at)}</span>
                      </div>
                      {isExpired(cupom.expires_at) && (
                        <Badge variant="destructive">Expirado</Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => handleCopyCode(cupom.code)}
                      disabled={isExpired(cupom.expires_at)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar código
                    </Button>
                  </div>
                  <div className="mt-3 p-2 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                    <code className="text-sm font-mono font-bold text-construPro-blue">
                      {cupom.code}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MeusCuponsScreen: React.FC = () => {
  return (
    <ErrorBoundary>
      <MeusCuponsScreenContent />
    </ErrorBoundary>
  );
};

export default MeusCuponsScreen;
