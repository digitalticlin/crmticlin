import { Crown, Star, Zap, Check, Sparkles } from "lucide-react";
import { messagePlans } from "@/modules/billing/data/messagePlans";
import { cn } from "@/lib/utils";

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanSelect: (planId: string) => void;
}

export function PlanSelector({ selectedPlan, onPlanSelect }: PlanSelectorProps) {
  const getPlanIcon = (planId: string) => {
    switch(planId) {
      case 'free_200': return Zap;
      case 'pro_5k': return Star;
      case 'ultra_15k': return Crown;
      case 'enterprise': return Sparkles;
      default: return Zap;
    }
  };

  const getPlanGradient = (planId: string) => {
    switch(planId) {
      case 'free_200': return 'from-green-500 to-emerald-600';
      case 'pro_5k': return 'from-purple-500 to-purple-600';
      case 'ultra_15k': return 'from-yellow-500 to-amber-600';
      case 'enterprise': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanBorderColor = (planId: string) => {
    switch(planId) {
      case 'free_200': return 'border-green-300 hover:border-green-400';
      case 'pro_5k': return 'border-purple-300 hover:border-purple-400';
      case 'ultra_15k': return 'border-yellow-300 hover:border-yellow-400';
      case 'enterprise': return 'border-blue-300 hover:border-blue-400';
      default: return 'border-gray-300 hover:border-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Escolha seu plano</h3>
        <p className="text-xs text-gray-600">Você pode começar com o plano gratuito</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {messagePlans.map((plan) => {
          const Icon = getPlanIcon(plan.id);
          const isSelected = selectedPlan === plan.id;
          const gradient = getPlanGradient(plan.id);
          const borderColor = getPlanBorderColor(plan.id);

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => {
                if (plan.is_enterprise) {
                  window.open('https://wa.me/5511999999999?text=Olá, gostaria de conhecer o plano Personalizado', '_blank');
                } else {
                  onPlanSelect(plan.id);
                }
              }}
              className={cn(
                "relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left",
                "hover:shadow-lg hover:scale-[1.02]",
                borderColor,
                isSelected
                  ? "bg-gradient-to-br from-white to-gray-50 shadow-md scale-[1.02]"
                  : "bg-white/50 backdrop-blur-sm",
                plan.is_enterprise && "opacity-90"
              )}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-ticlin-500 to-ticlin-600 rounded-full p-1 shadow-lg">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br shadow-md",
                  gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900">{plan.name}</h4>
                    {plan.is_trial && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Teste Grátis
                      </span>
                    )}
                    {plan.is_popular && (
                      <span className="text-xs bg-gradient-to-r from-ticlin-500 to-ticlin-600 text-white px-2 py-0.5 rounded-full font-medium">
                        MAIS VENDIDO
                      </span>
                    )}
                  </div>

                  <p className="text-lg font-bold text-gray-900 mb-1">
                    {plan.is_enterprise ? (
                      <span className="text-blue-600">Sob Consulta</span>
                    ) : plan.price === 0 ? (
                      <span className="text-green-600">200 mensagens Grátis</span>
                    ) : (
                      <>
                        R$ {plan.price.toFixed(2)}
                        <span className="text-sm font-normal text-gray-600">/mês</span>
                      </>
                    )}
                  </p>

                  <p className="text-xs text-gray-600 mb-2">{plan.description}</p>

                  {/* Features */}
                  <div className="space-y-1">
                    {plan.features.map((feature, idx) => {
                      const isBold = feature.startsWith('**') && feature.endsWith('**');
                      const text = isBold ? feature.slice(2, -2) : feature;

                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            `bg-gradient-to-r ${gradient}`
                          )} />
                          <span className={cn(
                            "text-xs text-gray-700",
                            isBold && "font-bold"
                          )}>
                            {text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info adicional */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Todos os planos incluem suporte pelo WhatsApp
        </p>
      </div>
    </div>
  );
}