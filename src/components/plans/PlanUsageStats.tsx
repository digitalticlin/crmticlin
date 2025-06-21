
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const activePlan = plans.find(p => p.id === currentPlan);
  
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        // Verificar se o usuário atual é admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        setIsSuperAdmin(profile?.role === 'admin' || false);
      } catch (error) {
        console.error("Erro ao verificar SuperAdmin:", error);
      }
    };
    
    checkSuperAdmin();
  }, []);
  
  if (!activePlan) return null;
  
  // Determinar limites a serem exibidos (ilimitado para SuperAdmin)
  const whatsappLimit = isSuperAdmin ? "∞" : activePlan.limits.whatsappNumbers;
  const teamMembersLimit = isSuperAdmin ? "∞" : activePlan.limits.teamMembers;
  const aiAgentsLimit = isSuperAdmin ? "∞" : activePlan.limits.aiAgents;
  
  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Detalhes do Plano Atual</CardTitle>
        <CardDescription>
          {isSuperAdmin 
            ? "Você é um Admin com acesso avançado" 
            : `Seu plano ${activePlan.name} inclui os seguintes limites`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>Números de WhatsApp</span>
              <span>{whatsappLimit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-ticlin h-2 rounded-full" style={{ width: isSuperAdmin ? "100%" : "60%" }}></div>
            </div>
            <div className="text-xs text-right mt-1">
              {isSuperAdmin ? "Acesso avançado" : `3 de ${activePlan.limits.whatsappNumbers} utilizados`}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Membros da Equipe</span>
              <span>{teamMembersLimit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-ticlin h-2 rounded-full" style={{ width: isSuperAdmin ? "100%" : "30%" }}></div>
            </div>
            <div className="text-xs text-right mt-1">
              {isSuperAdmin ? "Acesso avançado" : `3 de ${activePlan.limits.teamMembers} utilizados`}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Agentes de IA</span>
              <span>{aiAgentsLimit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-ticlin h-2 rounded-full" style={{ width: isSuperAdmin ? "100%" : "33%" }}></div>
            </div>
            <div className="text-xs text-right mt-1">
              {isSuperAdmin ? "Acesso avançado" : `1 de ${activePlan.limits.aiAgents} utilizados`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanUsageStats;
