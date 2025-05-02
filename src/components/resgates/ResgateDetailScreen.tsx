
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Check, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// Mock reward details
const mockResgates = [
  {
    id: '1',
    titulo: 'Vale-compra R$100',
    pontos: 1000,
    categoria: 'Vale-compra',
    imagemUrl: 'https://images.unsplash.com/photo-1577132922436-e9c50c3f10c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    descricao: 'Vale-compra no valor de R$100 para utilizar em qualquer loja parceira do ConstruPro+.',
    estoque: 50,
    prazoEntrega: '5-7 dias úteis'
  },
  {
    id: '2',
    titulo: 'Jogo de Chaves de Fenda',
    pontos: 500,
    categoria: 'Ferramentas',
    imagemUrl: 'https://images.unsplash.com/photo-1629743483408-c165e5296a99?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    descricao: 'Kit com 6 chaves de fenda profissionais de diferentes tamanhos, ideal para trabalhos de precisão.',
    estoque: 15,
    prazoEntrega: '10-15 dias úteis'
  },
  {
    id: '3',
    titulo: 'Camiseta ConstruPro',
    pontos: 300,
    categoria: 'Vestuário',
    imagemUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    descricao: 'Camiseta 100% algodão com logo ConstruPro+. Disponível nos tamanhos P, M, G e GG.',
    estoque: 30,
    prazoEntrega: '7-10 dias úteis'
  },
];

// Mock addresses
const mockAddresses = [
  {
    id: '1',
    nome: 'Casa',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Apto 123',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-200',
    principal: true,
  },
  {
    id: '2',
    nome: 'Trabalho',
    logradouro: 'Av. Brigadeiro Faria Lima',
    numero: '3477',
    complemento: '5º andar',
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04538-132',
    principal: false,
  }
];

const ResgateDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(
    mockAddresses.find(a => a.principal)?.id || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Find reward details
  const resgate = mockResgates.find(r => r.id === id);
  
  // Calculate date range for delivery
  const today = new Date();
  const deliveryDays = resgate?.prazoEntrega.split('-').map(Number) || [7, 10];
  
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + deliveryDays[0]);
  
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + deliveryDays[1]);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleRedeem = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmRedemption = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
      
      toast({
        title: "Resgate realizado com sucesso!",
        description: "Você pode acompanhar o status no histórico de resgates.",
      });
      
      navigate('/historico-resgates');
    }, 1500);
  };

  if (!resgate) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 p-6 pt-12">
        <button onClick={() => navigate(-1)} className="text-construPro-blue mb-4">
          <ArrowLeft size={24} />
        </button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Recompensa não encontrada. Volte para a lista de resgates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <button onClick={() => navigate(-1)} className="text-white mb-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Detalhe da Recompensa</h1>
      </div>
      
      {/* Product Image */}
      <div className="w-full h-64 overflow-hidden">
        <img 
          src={resgate.imagemUrl} 
          alt={resgate.titulo}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Reward Details */}
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold">{resgate.titulo}</h2>
          <div className="flex items-center bg-construPro-orange/10 text-construPro-orange text-sm rounded-full px-3 py-1 mt-2 inline-block">
            <span>{resgate.pontos} pontos</span>
          </div>
        </div>
        
        <Card className="p-4">
          <h3 className="font-medium mb-2">Detalhes</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Categoria</span>
              <span>{resgate.categoria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estoque</span>
              <span>{resgate.estoque} unidades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Prazo de entrega</span>
              <span>{resgate.prazoEntrega}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium mb-2">Descrição</h3>
          <p className="text-sm text-gray-700">{resgate.descricao}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center mb-2">
            <Calendar className="text-construPro-blue mr-2" size={18} />
            <h3 className="font-medium">Previsão de entrega</h3>
          </div>
          <p className="text-sm">
            Chegará entre <span className="font-medium">{formatDate(deliveryStart)}</span> e <span className="font-medium">{formatDate(deliveryEnd)}</span>
          </p>
        </Card>
        
        <CustomButton
          variant="primary"
          fullWidth
          onClick={handleRedeem}
        >
          Resgatar por {resgate.pontos} pontos
        </CustomButton>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar resgate</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Deseja resgatar <strong>{resgate.titulo}</strong> por <strong>{resgate.pontos} pontos</strong>?</p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Selecione o endereço de entrega</h4>
              <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                {mockAddresses.map(address => (
                  <div key={address.id} className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                    <div className="grid gap-1.5">
                      <Label htmlFor={`address-${address.id}`} className="font-medium">
                        {address.nome} {address.principal && '(Principal)'}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {address.logradouro}, {address.numero}
                        {address.complemento && `, ${address.complemento}`}<br />
                        {address.bairro}, {address.cidade} - {address.estado}<br />
                        CEP: {address.cep}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <Alert>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-construPro-blue" />
                <AlertTitle className="text-construPro-blue">Previsão de entrega</AlertTitle>
              </div>
              <AlertDescription>
                Entre {formatDate(deliveryStart)} e {formatDate(deliveryEnd)}
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <CustomButton
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              className="sm:w-auto w-full"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              onClick={confirmRedemption}
              loading={isLoading}
              className="sm:w-auto w-full"
              icon={<Check size={18} />}
            >
              Confirmar Resgate
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResgateDetailScreen;
