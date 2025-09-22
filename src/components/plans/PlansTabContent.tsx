
import { MessagePlanCard } from "@/modules/billing/components/MessagePlanCard";
import { UsageDisplay } from "@/modules/billing/components/UsageDisplay";
import { CustomPlanSection } from "./CustomPlanSection";
import { messagePlans } from "@/modules/billing/data/messagePlans";
import { useMessageUsage } from "@/modules/billing/hooks/useMessageUsage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Users, MessageSquare } from "lucide-react";

interface PlansTabContentProps {
  currentPlan?: string;
}

const PlansTabContent = ({ currentPlan }: PlansTabContentProps) => {
  const { usage } = useMessageUsage();
  
  // Determinar plano atual baseado no usage tracking
  const currentPlanType = usage?.plan_subscription_id || currentPlan;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200/30">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 Escolha o Plano Ideal
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Automatize seu WhatsApp com IA avançada. <span className="font-semibold text-ticlin">Sem mensalidades escondidas.</span> Cancele quando quiser.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Badge className="bg-green-100 text-green-700 px-3 py-1">
            <Shield className="h-4 w-4 mr-1" />
            30 dias grátis
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
            <Clock className="h-4 w-4 mr-1" />
            Cancele a qualquer momento
          </Badge>
          <Badge className="bg-purple-100 text-purple-700 px-3 py-1">
            <MessageSquare className="h-4 w-4 mr-1" />
            Suporte pelo WhatsApp
          </Badge>
        </div>
      </div>
      
      {/* Cards dos Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {messagePlans.map((plan, index) => (
          <MessagePlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlanType}
            isPopular={index === 1} // Plano do meio como popular
          />
        ))}
      </div>
      
      {/* Seção de Planos Personalizados */}
      <CustomPlanSection />
      
      {/* Comparativo de Recursos */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-center text-2xl">📊 Compare os Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-4 px-2 font-semibold">Recursos</th>
                  {messagePlans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-2 min-w-[120px]">
                      <div className="space-y-1">
                        <div className="font-semibold">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">R${plan.price}/mês</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium">Mensagens IA/mês</td>
                  {messagePlans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      <span className="font-bold text-ticlin">
                        {(plan.message_limit / 1000).toFixed(0)}k
                      </span>
                    </td>
                  ))}
                </tr>
                
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium">Usuários</td>
                  {messagePlans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.max_users === -1 ? (
                        <span className="text-green-600 font-semibold">Ilimitados</span>
                      ) : (
                        <span className="font-bold">{plan.max_users}</span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="border-b">
                  <td className="py-3 px-2 font-medium">Números WhatsApp</td>
                  {messagePlans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      {plan.max_whatsapp_numbers === -1 ? (
                        <span className="text-green-600 font-semibold">Ilimitados</span>
                      ) : (
                        <span className="font-bold">{plan.max_whatsapp_numbers}</span>
                      )}
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="py-3 px-2 font-medium">Custo por mensagem</td>
                  {messagePlans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-2">
                      <span className="text-green-600 font-semibold">
                        R${(plan.price / plan.message_limit).toFixed(3)}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Uso Atual - Se houver plano ativo */}
      {currentPlanType && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">📈 Seu Uso Atual</h2>
          <UsageDisplay />
        </div>
      )}
      
      {/* FAQ Seção */}
      <Card className="glass-card border-0 bg-gray-50 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-center text-2xl">❓ Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🆓 Como funciona o trial de 30 dias?</h4>
              <p className="text-sm text-muted-foreground">
                Teste grátis por 30 dias com 200 mensagens IA. Sem cartão de crédito. Apenas uma vez por usuário.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">💳 Posso mudar de plano a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Faça upgrade ou downgrade instantaneamente. Mudanças são aplicadas imediatamente com cobrança proporcional.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🚫 O que acontece se exceder o limite?</h4>
              <p className="text-sm text-muted-foreground">
                Suas mensagens são pausadas temporariamente. Você recebe avisos aos 75% e 90% do limite para fazer upgrade.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📊 As mensagens acumulam?</h4>
              <p className="text-sm text-muted-foreground">
                Não, o limite renova todo mês. Cada ciclo você recebe seu limite completo novamente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔒 Posso cancelar quando quiser?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Cancele a qualquer momento. Sem multas ou taxas. Você mantém acesso até o fim do período pago.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">💰 Qual meio de pagamento vocês aceitam?</h4>
              <p className="text-sm text-muted-foreground">
                Cartão de crédito, PIX e boleto bancário. Processamento seguro via Mercado Pago.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansTabContent;
