
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Gift, Settings, CheckCircle, Star, ArrowRight, Users, TrendingUp, Award, MapPin, Truck, ShieldCheck } from 'lucide-react';
import LazyImage from '@/components/common/LazyImage';

const LandingPage = () => {
  const navigate = useNavigate();
  const showMultisegmentHero = process.env.NEXT_PUBLIC_SHOW_MULTISEGMENT_HERO !== 'false';
  
  const handleSignUp = () => {
    navigate('/signup');
  };
  const handleLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-white" itemScope itemType="https://schema.org/LocalBusiness">
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Matershop",
          "description": "Marketplace de negócios locais começando pela construção",
          "url": "https://www.matershop.com.br",
          "telephone": "+55-11-99999-9999",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "BR"
          },
          "openingHours": "Mo-Fr 08:00-18:00",
          "priceRange": "$$",
          "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "Pix"],
          "currenciesAccepted": "BRL"
        })}
      </script>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-royal-blue" itemProp="name">Matershop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogin} className="border-royal-blue text-royal-blue hover:bg-royal-blue hover:text-white">
                Entrar
              </Button>
              <Button onClick={handleSignUp} className="bg-orange-points hover:bg-orange-points/90 text-white">
                Criar Conta
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="bg-gradient-to-b from-gray-50 to-white py-[50px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {showMultisegmentHero ? (
                <>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6" itemProp="description">
                    Tudo do seu bairro a um clique: da{' '}
                    <span className="text-royal-blue">obra</span> ao{' '}
                    <span className="text-orange-points">dia a dia</span>.
                  </h1>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Compare preços, ganhe pontos e receba em casa produtos de lojas parceiras da sua região.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                    Matershop conecta você às{' '}
                    <span className="text-royal-blue">melhores ofertas</span> e{' '}
                    <span className="text-orange-points">recompensas</span> da
                    construção civil
                  </h1>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Cadastre-se grátis, garanta descontos exclusivos e acumule pontos online e nas lojas físicas parceiras.
                  </p>
                </>
              )}
              
              <div className="space-y-4">
                <Button onClick={handleSignUp} size="lg" className="bg-orange-points hover:bg-orange-points/90 text-white text-lg px-8 py-4 rounded-lg shadow-lg">
                  {showMultisegmentHero ? 'Explorar minha região' : 'Criar conta gratuita'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-gray-500">
                  <strong>Profissional e consumidor?</strong> Use seu CNPJ/CPF para benefícios extras!
                </p>
              </div>

              {/* Benefits Bullets */}
              {showMultisegmentHero && (
                <div className="mt-8 space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Award className="h-5 w-5 text-orange-points mr-3 flex-shrink-0" />
                    <span className="font-medium">Pontuação inteligente em cada compra</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Truck className="h-5 w-5 text-orange-points mr-3 flex-shrink-0" />
                    <span className="font-medium">Entrega expressa no CEP que você escolher</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <ShieldCheck className="h-5 w-5 text-orange-points mr-3 flex-shrink-0" />
                    <span className="font-medium">Negócios verificados • Suporte local</span>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <LazyImage 
                src="/lovable-uploads/2a4834bb-9836-4472-83f1-737a07c2d9c8.png"
                alt="App Matershop - Marketplace de negócios locais"
                className="w-full max-w-md mx-auto rounded-2xl object-contain"
                placeholderClassName="w-full max-w-md mx-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {showMultisegmentHero ? 'Por que escolher nosso marketplace?' : 'Por que escolher a Matershop?'}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {showMultisegmentHero ? (
              <>
                <Card className="border-0 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <Award className="h-12 w-12 text-orange-points mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Pontuação inteligente em cada compra
                    </h3>
                    <p className="text-gray-600">
                      Sistema de pontos que recompensa sua fidelidade com benefícios reais.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 text-orange-points mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Entrega expressa no CEP que você escolher
                    </h3>
                    <p className="text-gray-600">
                      Receba seus produtos rapidamente no endereço que preferir.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <ShieldCheck className="h-12 w-12 text-orange-points mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Negócios verificados • Suporte local
                    </h3>
                    <p className="text-gray-600">
                      Parceiros verificados da sua região com suporte dedicado e confiável.
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-0 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <Gift className="h-12 w-12 text-orange-points mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Cupons exclusivos
                    </h3>
                    <p className="text-gray-600">
                      Descontos especiais em materiais de construção direto no seu celular.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <Award className="h-12 w-12 text-orange-points mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Pontos que viram prêmios/recompensas
                    </h3>
                    <p className="text-gray-600">
                      Cada compra gera pontos que você troca por produtos e benefícios.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <Settings className="h-12 w-12 text-orange-points mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Gestão em um só lugar
                    </h3>
                    <p className="text-gray-600">
                      Acompanhe saldo, nível no clube e histórico de resgates pelo site. Transparência total para você planejar suas compras.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600">
              Em 4 passos simples você já está economizando
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
            step: 1,
            title: "Cadastre-se",
            desc: "Crie sua conta gratuita em menos de 2 minutos"
          }, {
            step: 2,
            title: "Aproveite descontos",
            desc: showMultisegmentHero ? "Acesse ofertas dos negócios da sua região" : "Acesse cupons exclusivos para materiais"
          }, {
            step: 3,
            title: "Compre & acumule",
            desc: "Ganhe pontos a cada compra online ou física"
          }, {
            step: 4,
            title: "Troque por recompensas",
            desc: "Use seus pontos em prêmios incríveis"
          }].map(item => <div key={item.step} className="text-center">
                <div className="bg-royal-blue text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.desc}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Pro Block Section */}
      <section id="pro-block" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-200 rounded-2xl p-12 shadow-xl">
              <TrendingUp className="h-48 w-48 mx-auto text-royal-blue" />
              <p className="text-center text-gray-600 mt-4">Dashboard Profissional</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Feito sob medida para quem vive de obra
              </h2>
              <div className="space-y-4">
                {["Compare preços sem sair da obra", "Ganhe até 3× mais pontos como profissional", "Dashboard único com todos os seus pedidos e pontos", "Programa de indicação: convide colegas, ganhe pontos extras"].map((benefit, index) => <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-orange-points mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-lg text-gray-700">{benefit}</p>
                  </div>)}
              </div>
              <Button onClick={handleSignUp} size="lg" className="bg-royal-blue hover:bg-royal-blue/90 text-white mt-8 px-8 py-4 rounded-lg">
                Começar agora
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              O que dizem nossos usuários
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{
            name: "João Silva",
            role: "Pedreiro",
            content: "Economizei mais de R$ 500 no último mês só com os cupons. Recomendo para todos os colegas!"
          }, {
            name: "Maria Santos",
            role: "Engenheira Civil",
            content: "O dashboard é perfeito para acompanhar todos os gastos da obra. Organização que faltava!"
          }, {
            name: "Carlos Oliveira",
            role: "Mestre de Obra",
            content: "Os pontos acumulam rápido e já troquei por várias ferramentas. Sistema muito bom!"
          }].map((testimonial, index) => <Card key={index} className="border-0 shadow-lg rounded-lg">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="final-cta" className="py-20 bg-royal-blue">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para economizar e ganhar recompensas?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {showMultisegmentHero ? 
              'Junte-se a milhares que já descobriram os melhores negócios da região' :
              'Junte-se a milhares de profissionais e consumidores que já economizam com a Matershop'
            }
          </p>
          <Button onClick={handleSignUp} size="lg" className="bg-orange-points hover:bg-orange-points/90 text-white text-xl px-12 py-6 rounded-lg shadow-xl">
            Cadastre-se agora
            <Users className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Matershop</h3>
            <p className="text-gray-400 mb-6">
              {showMultisegmentHero ? 
                'O marketplace de negócios locais (começamos pela construção)' :
                'Marketplace e Clube de Compras Inteligentes para Profissionais e Consumidores da Construção'
              }
            </p>
            <div className="flex justify-center space-x-6">
              <Button variant="outline" onClick={handleLogin} className="border-gray-600 text-gray-300 bg-orange-points">
                Já tem conta? Entre aqui
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
