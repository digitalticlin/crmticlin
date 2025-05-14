
import StatCard from "@/components/dashboard/StatCard";
import { MessageSquare, Users, Zap } from "lucide-react";

export default function StatsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Total de Contas"
        value="12"
        description="Contas conectadas ao WhatsApp"
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <StatCard 
        title="Membros da Equipe"
        value="8"
        description="Ativos na plataforma"
        icon={<Users className="h-5 w-5" />}
        color="bg-blue-500"
      />
      <StatCard 
        title="Agentes de IA"
        value="3"
        description="Configurados e ativos"
        icon={<Zap className="h-5 w-5" />}
        color="bg-purple-500"
      />
    </div>
  );
}
