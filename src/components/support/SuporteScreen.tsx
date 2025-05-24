
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const SuporteScreen: React.FC = () => {
  const navigate = useNavigate();

  const supportOptions = [
    {
      id: 'chat',
      title: 'Chat ao vivo',
      description: 'Fale conosco agora mesmo',
      icon: <MessageSquare size={24} />,
      available: true,
      action: () => navigate('/chat')
    },
    {
      id: 'phone',
      title: 'WhatsApp',
      description: '(33) 99959-9191',
      icon: <Phone size={24} />,
      available: true,
      action: () => window.open('https://wa.me/5533999599191')
    },
    {
      id: 'email',
      title: 'E-mail',
      description: 'loja@matershop.com.br',
      icon: <Mail size={24} />,
      available: true,
      action: () => window.open('mailto:loja@matershop.com.br')
    }
  ];

  const faqItems = [
    {
      question: 'Como posso rastrear meu pedido?',
      answer: 'Você pode acompanhar seu pedido na seção "Minhas Compras" ou através do código de rastreamento enviado por e-mail.'
    },
    {
      question: 'Como funcionam os pontos de fidelidade?',
      answer: 'A cada compra você ganha pontos que podem ser trocados por descontos e produtos exclusivos na nossa loja de recompensas.'
    },
    {
      question: 'Qual o prazo de entrega?',
      answer: 'O prazo varia de acordo com sua localização e o produto escolhido. Consulte as informações na página do produto.'
    },
    {
      question: 'Como cancelar um pedido?',
      answer: 'Pedidos podem ser cancelados até 2 horas após a confirmação. Entre em contato conosco o quanto antes.'
    }
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
          <h1 className="text-xl font-bold text-white">Suporte</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Contact Options */}
        <div>
          <h2 className="font-bold text-lg mb-3">Entre em contato</h2>
          <div className="space-y-3">
            {supportOptions.map((option) => (
              <Card 
                key={option.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={option.action}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-construPro-blue/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-construPro-blue">{option.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {option.available && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Hours */}
        <div>
          <h2 className="font-bold text-lg mb-3">Horário de atendimento</h2>
          <Card className="p-4">
            <div className="flex items-center mb-2">
              <Clock size={20} className="text-construPro-blue mr-2" />
              <span className="font-medium">Atendimento</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 ml-7">
              <p>Segunda a Sexta: 8h às 18h</p>
              <p>Sábado: 8h às 12h</p>
              <p>Domingo: Fechado</p>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-bold text-lg mb-3">Perguntas frequentes</h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <Card key={index} className="p-4">
                <h3 className="font-medium mb-2">{item.question}</h3>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuporteScreen;
