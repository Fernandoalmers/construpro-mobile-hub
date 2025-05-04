
import React from 'react';
import { Truck, Shield, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductDetailsProps {
  description: string;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ description }) => {
  return (
    <>
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Descrição do Produto</h2>
          <p className="text-gray-700 whitespace-pre-line">{description || 'Sem descrição disponível para este produto.'}</p>
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
              <p className="text-xs text-gray-600">Enviamos para todo o Brasil</p>
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
              <p className="text-xs text-gray-600">Devolução em até 7 dias</p>
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
              <p className="text-xs text-gray-600">Acumule e troque por produtos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProductDetails;
