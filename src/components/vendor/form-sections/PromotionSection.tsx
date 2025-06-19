
import React from 'react';
import { Zap, Calendar, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PromotionSectionProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
}

const PromotionSection: React.FC<PromotionSectionProps> = ({ formData, onInputChange }) => {
  const watchPromocaoAtiva = formData.promocaoAtiva || false;
  const watchPrecoPromocional = formData.precoPromocional || null;
  const watchPreco = formData.preco || 0;

  // Calculate discount percentage for preview
  const discountPercentage = watchPrecoPromocional && watchPreco && watchPrecoPromocional < watchPreco
    ? Math.round(((watchPreco - watchPrecoPromocional) / watchPreco) * 100)
    : 0;

  // Validation for promotional price
  const hasValidPromotionalPrice = watchPrecoPromocional && watchPreco && watchPrecoPromocional < watchPreco;
  const promotionalPriceError = watchPromocaoAtiva && watchPrecoPromocional && watchPreco && watchPrecoPromocional >= watchPreco;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Promoção com Temporizador
          {watchPromocaoAtiva && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
              Ativa
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Como funciona o temporizador de ofertas:</p>
              <ul className="space-y-1 text-xs">
                <li>• Configure um preço promocional menor que o preço normal</li>
                <li>• Defina o período da promoção (início e fim)</li>
                <li>• O countdown será exibido automaticamente no marketplace</li>
                <li>• A promoção será desativada automaticamente quando expirar</li>
                <li>• Produtos com promoções expiradas são removidos automaticamente do carrinho</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={watchPromocaoAtiva}
            onCheckedChange={(checked) => {
              onInputChange('promocaoAtiva', checked);
              // Reset promotional price when deactivating promotion
              if (!checked) {
                onInputChange('precoPromocional', null);
                onInputChange('promocaoInicio', '');
                onInputChange('promocaoFim', '');
              }
            }}
          />
          <label className="font-medium text-sm">
            Ativar promoção com temporizador
          </label>
        </div>

        {watchPromocaoAtiva && (
          <div className="space-y-4 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço promocional*</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    max={watchPreco ? watchPreco - 0.01 : undefined}
                    onChange={(e) => onInputChange('precoPromocional', e.target.value ? parseFloat(e.target.value) : null)}
                    value={watchPrecoPromocional || ''}
                    className={`pl-9 ${promotionalPriceError ? 'border-red-500' : ''}`}
                    placeholder="0,00"
                  />
                </div>
                {promotionalPriceError && (
                  <p className="text-xs text-red-600 mt-1">
                    O preço promocional deve ser menor que o preço normal (R$ {watchPreco?.toFixed(2)})
                  </p>
                )}
                {discountPercentage > 0 && !promotionalPriceError && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Desconto de {discountPercentage}% aplicado
                  </p>
                )}
              </div>

              {discountPercentage > 0 && !promotionalPriceError && (
                <div className="flex items-center justify-center">
                  <div className="bg-red-500 text-white px-3 py-2 rounded-lg text-center">
                    <div className="text-lg font-bold">-{discountPercentage}%</div>
                    <div className="text-xs">Preview da badge</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Calendar size={14} />
                  Início da promoção*
                </label>
                <Input 
                  type="datetime-local"
                  value={formData.promocaoInicio || ''}
                  onChange={(e) => onInputChange('promocaoInicio', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Calendar size={14} />
                  Fim da promoção*
                </label>
                <Input 
                  type="datetime-local"
                  value={formData.promocaoFim || ''}
                  onChange={(e) => onInputChange('promocaoFim', e.target.value)}
                  min={formData.promocaoInicio || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            {watchPromocaoAtiva && hasValidPromotionalPrice && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Preview da Oferta:</h4>
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="line-through text-gray-500">R$ {watchPreco?.toFixed(2)}</span>
                    <span className="ml-2 text-lg font-bold text-blue-600">
                      R$ {watchPrecoPromocional?.toFixed(2)}
                    </span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      -{discountPercentage}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Economia de R$ {(watchPreco - watchPrecoPromocional)?.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionSection;
