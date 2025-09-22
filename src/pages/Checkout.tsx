import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Crown, Star, Zap, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MercadoPagoService } from '@/modules/billing/services/mercadopagoService';
import { messagePlans } from '@/modules/billing/data/messagePlans';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get('plan');
  const plan = messagePlans.find(p => p.id === planId);

  const getPlanIcon = () => {
    if (planId === 'ultra_15k') return Crown;
    if (planId === 'pro_5k') return Star;
    return Zap;
  };

  const getPlanColor = () => {
    if (planId === 'ultra_15k') return 'from-yellow-500 to-yellow-600';
    if (planId === 'pro_5k') return 'from-purple-500 to-purple-600';
    return 'from-blue-500 to-blue-600';
  };

  useEffect(() => {
    if (!plan || plan.id === 'free_200') {
      // Plano inválido ou gratuito - volta pro dashboard
      toast.error('Plano inválido ou gratuito');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Log do plano selecionado
    console.log('[Checkout] Plano selecionado:', plan);
  }, [plan, navigate]);

  const initiateCheckout = async () => {
    if (!plan) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[Checkout] Iniciando checkout para:', plan.name);
      const checkoutUrl = await MercadoPagoService.createCheckoutSession(plan);

      if (checkoutUrl && checkoutUrl !== 'TRIAL_ACTIVATED') {
        console.log('[Checkout] Redirecionando para Mercado Pago');
        toast.success('Redirecionando para pagamento...');

        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 1500);
      } else {
        setError('Erro ao criar sessão de pagamento');
        toast.error('Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('[Checkout] Erro no checkout:', error);
      setError('Erro interno no processamento');
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/plans', { replace: true });
  };

  if (!plan) {
    return null; // Componente já redirecionou
  }

  const Icon = getPlanIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Pagamento</h1>
          <p className="text-gray-600">Complete sua assinatura do CRM Ticlin</p>
        </div>

        {/* Card do Plano */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`p-2 rounded-full bg-gradient-to-r ${getPlanColor()}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">
                {planId === 'ultra_15k' ? 'MAIS VENDIDO' : 'RECOMENDADO'}
              </Badge>
            </div>

            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Preço */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-500 line-through">
                  R$ {(plan.price * 1.5).toFixed(0)}
                </span>
                <span className="text-4xl font-bold text-gray-900">
                  R$ {plan.price.toFixed(0)}
                </span>
              </div>
              <p className="text-sm text-gray-600">/mês • Renovação automática</p>
              <p className="text-sm font-medium text-green-600 mt-1">
                💰 Economia de {((plan.price * 1.5) - plan.price).toFixed(0)}% no primeiro mês
              </p>
            </div>

            {/* Recursos */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Inclusos no plano:</h4>
              <ul className="space-y-2">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 shrink-0"></div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Métodos de Pagamento */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Métodos de Pagamento
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Cartão de crédito, PIX, boleto bancário
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ✓ Processado com segurança pelo Mercado Pago
              </p>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                onClick={initiateCheckout}
                disabled={loading}
                className={`w-full h-12 text-base font-bold transition-all duration-300 bg-gradient-to-r ${getPlanColor()} hover:opacity-90 text-white shadow-lg hover:shadow-xl`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagar R$ {plan.price.toFixed(0)}/mês
                  </div>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Planos
              </Button>
            </div>

            {/* Garantia */}
            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p>🔒 Pagamento 100% seguro</p>
              <p>✓ Cancele a qualquer momento</p>
              <p>✓ Suporte técnico incluso</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}