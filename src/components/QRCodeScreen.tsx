
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

const QRCodeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleScanDemo = () => {
    toast.success("QR Code escaneado com sucesso! +100 pontos");
    setTimeout(() => {
      navigate('/home');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-construPro-blue p-4 pt-12 flex items-center">
        <Button 
          variant="ghost" 
          className="p-2 mr-2 text-white" 
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-xl font-bold text-white">QR Code</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center p-6 gap-6 flex-grow">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xs aspect-square flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Posicione o QR Code aqui</p>
            <Button 
              onClick={handleScanDemo}
              className="bg-construPro-orange hover:bg-construPro-orange/90"
            >
              Simular escaneamento
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="font-bold text-lg mb-2">Escaneie QR Codes em lojas parceiras</h2>
          <p className="text-gray-600 text-sm">
            Acumule pontos registrando suas compras nas lojas físicas da nossa rede de parceiros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScreen;
