
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

const EscanearScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('QR-CODE-12345');
      toast.success('QR Code escaneado com sucesso! +100 pontos adicionados.');
    }, 3000);
  };

  const handleManualEntry = () => {
    const code = prompt('Digite o código manualmente:');
    if (code) {
      setScanResult(code);
      toast.success('Código registrado com sucesso! +50 pontos adicionados.');
    }
  };

  const scanInstructions = [
    'Posicione o QR Code dentro da área de escaneamento',
    'Mantenha o celular estável',
    'Certifique-se de que há boa iluminação',
    'O QR Code deve estar limpo e visível'
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-4 pt-12">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-2 mr-2 text-white hover:bg-white/20" 
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-white">Escanear QR Code</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Scanner Area */}
        <div>
          <h2 className="font-bold text-lg mb-3">Escaneamento</h2>
          <Card className="p-6">
            <div className="flex flex-col items-center">
              {!isScanning && !scanResult && (
                <>
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                    <QrCode size={64} className="text-gray-400" />
                  </div>
                  <p className="text-center text-gray-600 mb-4">
                    Posicione o QR Code da loja dentro da área acima
                  </p>
                  <Button 
                    onClick={handleStartScan}
                    className="w-full bg-construPro-blue hover:bg-construPro-blue/90 mb-2"
                  >
                    <Camera size={18} className="mr-2" />
                    Iniciar escaneamento
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleManualEntry}
                    className="w-full"
                  >
                    Digitar código manualmente
                  </Button>
                </>
              )}

              {isScanning && (
                <>
                  <div className="w-48 h-48 border-2 border-construPro-blue rounded-lg flex items-center justify-center mb-4 animate-pulse">
                    <Camera size={64} className="text-construPro-blue" />
                  </div>
                  <p className="text-center text-construPro-blue font-medium mb-4">
                    Escaneando QR Code...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-construPro-blue h-2 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </>
              )}

              {scanResult && (
                <>
                  <div className="w-48 h-48 border-2 border-green-500 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle size={64} className="text-green-500" />
                  </div>
                  <p className="text-center text-green-600 font-medium mb-2">
                    QR Code escaneado com sucesso!
                  </p>
                  <p className="text-center text-gray-600 mb-4">
                    Código: {scanResult}
                  </p>
                  <Button 
                    onClick={() => {
                      setScanResult(null);
                      navigate('/home');
                    }}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Continuar
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="font-bold text-lg mb-3">Como usar</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {scanInstructions.map((instruction, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-construPro-blue text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{instruction}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Benefits */}
        <div>
          <h2 className="font-bold text-lg mb-3">Ganhe pontos</h2>
          <Card className="p-4 bg-construPro-orange/10 border-construPro-orange/20">
            <div className="flex items-center mb-2">
              <AlertCircle size={20} className="text-construPro-orange mr-2" />
              <span className="font-medium text-construPro-orange">Importante</span>
            </div>
            <p className="text-sm text-gray-700">
              Escaneie QR Codes em lojas parceiras para acumular pontos a cada compra física. 
              Os pontos podem ser trocados por descontos e produtos exclusivos.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EscanearScreen;
