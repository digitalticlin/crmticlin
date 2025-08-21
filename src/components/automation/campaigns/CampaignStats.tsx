
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Badge } from "@/components/ui/badge";
import { BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";
import { BarChart3, Users, MessageSquare, Clock, TrendingUp } from "lucide-react";

interface CampaignStatsProps {
  campaigns: BroadcastCampaign[];
}

export const CampaignStats = ({ campaigns }: CampaignStatsProps) => {
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
  const successRate = totalRecipients > 0 ? ((totalSent / totalRecipients) * 100).toFixed(1) : '0';

  const stats = [
    {
      title: "Total de Campanhas",
      value: totalCampaigns,
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Campanhas Ativas", 
      value: activeCampaigns,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Destinatários",
      value: totalRecipients.toLocaleString(),
      icon: Users,
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
    },
    {
      title: "Mensagens Enviadas",
      value: totalSent.toLocaleString(),
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Taxa de Sucesso",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <ModernCard key={index}>
          <ModernCardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>
      ))}
    </div>
  );
};
