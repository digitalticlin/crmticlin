
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    whatsappNumbers: number;
    teamMembers: number;
    aiAgents: number;
  };
}

export default function Plans() {
  const [currentPlan, setCurrentPlan] = useState<string>("pro");
  
  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      price: 99,
      description: "Ideal para pequenas empresas começando no WhatsApp",
      features: [
        "1 número de WhatsApp",
        "3 membros de equipe",
        "Funil Kanban básico",
        "Chat WhatsApp integrado",
        "Suporte por e-mail"
      ],
      limits: {
        whatsappNumbers: 1,
        teamMembers: 3,
        aiAgents: 0
      }
    },
    {
      id: "pro",
      name: "Pro",
      price: 199,
      description: "Para empresas com operação de vendas estabelecida",
      features: [
        "5 números de WhatsApp",
        "10 membros de equipe",
        "Funil Kanban avançado",
        "Etiquetas e categorias",
        "3 Agentes de IA",
        "Suporte prioritário"
      ],
      limits: {
        whatsappNumbers: 5,
        teamMembers: 10,
        aiAgents: 3
      }
    },
    {
      id: "business",
      name: "Business",
      price: 399,
      description: "Para operações comerciais completas",
      features: [
        "Números de WhatsApp ilimitados",
        "Usuários ilimitados",
        "Funil Kanban premium",
        "Automações avançadas",
        "10 Agentes de IA",
        "API de integração",
        "Gerente de conta dedicado"
      ],
      limits: {
        whatsappNumbers: 999,
        teamMembers: 999,
        aiAgents: 10
      }
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Planos</h1>
            <p className="text-muted-foreground">Escolha o plano ideal para o seu negócio</p>
          </div>
          
          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`glass-card border overflow-hidden ${
                  currentPlan === plan.id 
                    ? "border-ticlin ring-2 ring-ticlin" 
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{plan.name}</span>
                    {currentPlan === plan.id && (
                      <span className="text-xs bg-ticlin text-black px-2 py-1 rounded-full">
                        Atual
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-baseline">
                    <span className="text-3xl font-bold">R${plan.price}</span>
                    <span className="ml-1 text-muted-foreground">/mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{plan.description}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-ticlin mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {currentPlan === plan.id ? (
                    <Button className="w-full" variant="outline">
                      Plano Atual
                    </Button>
                  ) : (
                    <Button className={`w-full ${
                      currentPlan && plans.findIndex(p => p.id === plan.id) > 
                      plans.findIndex(p => p.id === currentPlan)
                        ? "bg-ticlin hover:bg-ticlin/90 text-black" 
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}>
                      {currentPlan && plans.findIndex(p => p.id === plan.id) > 
                      plans.findIndex(p => p.id === currentPlan) ? (
                        <>Fazer Upgrade <ArrowRight className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Fazer Downgrade <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-8">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Detalhes do Plano Atual</CardTitle>
                <CardDescription>
                  Seu plano {plans.find(p => p.id === currentPlan)?.name} inclui os seguintes limites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Números de WhatsApp</span>
                      <span>{plans.find(p => p.id === currentPlan)?.limits.whatsappNumbers}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-ticlin h-2 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                    <div className="text-xs text-right mt-1">3 de {plans.find(p => p.id === currentPlan)?.limits.whatsappNumbers} utilizados</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Membros da Equipe</span>
                      <span>{plans.find(p => p.id === currentPlan)?.limits.teamMembers}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-ticlin h-2 rounded-full" style={{ width: "30%" }}></div>
                    </div>
                    <div className="text-xs text-right mt-1">3 de {plans.find(p => p.id === currentPlan)?.limits.teamMembers} utilizados</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Agentes de IA</span>
                      <span>{plans.find(p => p.id === currentPlan)?.limits.aiAgents}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-ticlin h-2 rounded-full" style={{ width: "33%" }}></div>
                    </div>
                    <div className="text-xs text-right mt-1">1 de {plans.find(p => p.id === currentPlan)?.limits.aiAgents} utilizados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
