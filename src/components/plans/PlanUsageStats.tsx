
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface PlanUsageStatsProps {
  currentPlan: string;
  plans: Plan[];
}

const PlanUsageStats = ({ currentPlan, plans }: PlanUsageStatsProps) => {
  const activePlan = plans.find(p => p.id === currentPlan);
  
  if (!activePlan) return null;
  
  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Detalhes do Plano Atual</CardTitle>
        <CardDescription>
          Seu plano {activePlan.name} inclui os seguintes limites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>Números de WhatsApp</span>
              <span>{activePlan.limits.whatsappNumbers}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-ticlin h-2 rounded-full" style={{ width: "60%" }}></div>
            </div>
            <div className="text-xs text-right mt-1">3 de {activePlan.limits.whatsappNumbers} utilizados</div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Membros da Equipe</span>
              <span>{activePlan.limits.teamMembers}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-ticlin h-2 rounded-full" style={{ width: "30%" }}></div>
            </div>
            <div className="text-xs text-right mt-1">3 de {activePlan.limits.teamMembers} utilizados</div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Agentes de IA</span>
              <span>{activePlan.limits.aiAgents}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-ticlin h-2 rounded-full" style={{ width: "33%" }}></div>
            </div>
            <div className="text-xs text-right mt-1">1 de {activePlan.limits.aiAgents} utilizados</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanUsageStats;
