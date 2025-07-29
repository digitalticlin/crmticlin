
import { MessagePlanCard } from "@/modules/billing/components/MessagePlanCard";
import { UsageDisplay } from "@/modules/billing/components/UsageDisplay";
import { messagePlans } from "@/modules/billing/data/messagePlans";
import { useMessageUsage } from "@/modules/billing/hooks/useMessageUsage";

interface PlansTabContentProps {
  currentPlan?: string;
}

const PlansTabContent = ({ currentPlan }: PlansTabContentProps) => {
  const { usage } = useMessageUsage();
  
  // Determinar plano atual baseado no usage tracking
  const currentPlanType = usage?.plan_subscription_id || currentPlan;

  return (
    <div className="space-y-8">
      {/* Header da Seção */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Escolha o Plano Ideal</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Selecione o plano que melhor atende às suas necessidades de mensagens. 
          Você pode fazer upgrade ou downgrade a qualquer momento.
        </p>
      </div>
      
      {/* Cards dos Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {messagePlans.map((plan, index) => (
          <MessagePlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlanType}
            isPopular={index === 1} // Plano do meio como popular
          />
        ))}
      </div>
      
      {/* Seção de Perguntas Frequentes */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Perguntas Frequentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sm mb-2">Posso mudar de plano a qualquer momento?</h4>
            <p className="text-sm text-muted-foreground">
              Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
              As mudanças são aplicadas no próximo ciclo de faturamento.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">O que acontece se eu exceder o limite?</h4>
            <p className="text-sm text-muted-foreground">
              Suas mensagens serão temporariamente bloqueadas até que você faça upgrade 
              do plano ou até o próximo período de renovação.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">As mensagens não utilizadas acumulam?</h4>
            <p className="text-sm text-muted-foreground">
              Não, as mensagens são renovadas mensalmente e não acumulam. 
              Cada mês você recebe um novo limite completo.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Posso cancelar a qualquer momento?</h4>
            <p className="text-sm text-muted-foreground">
              Sim, você pode cancelar sua assinatura a qualquer momento através do 
              portal de gerenciamento ou entrando em contato conosco.
            </p>
          </div>
        </div>
      </div>
      
      {/* Uso Atual - Se houver plano ativo */}
      {currentPlanType && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Uso Atual do Plano</h2>
          <UsageDisplay />
        </div>
      )}
    </div>
  );
};

export default PlansTabContent;
