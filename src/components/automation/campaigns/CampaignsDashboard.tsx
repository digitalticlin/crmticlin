
import { useState } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBroadcastCampaigns } from "@/hooks/broadcast/useBroadcastCampaigns";
import { Play, Pause, BarChart3, Users, MessageSquare, Clock, Search, Filter } from "lucide-react";
import { CampaignExecutionCard } from "./CampaignExecutionCard";
import { CampaignStats } from "./CampaignStats";

export const CampaignsDashboard = () => {
  const { campaigns, loading, startCampaign } = useBroadcastCampaigns();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStartCampaign = async (campaignId: string) => {
    await startCampaign(campaignId);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <CampaignStats campaigns={campaigns} />
      
      {/* Filters and Search */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Campaign Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Suas Campanhas</h2>
        
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <ModernCard key={i} className="animate-pulse">
                <ModernCardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </ModernCardContent>
              </ModernCard>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <ModernCard>
            <ModernCardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Crie sua primeira campanha para começar"}
              </p>
            </ModernCardContent>
          </ModernCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <CampaignExecutionCard 
                key={campaign.id}
                campaign={campaign}
                onStart={() => handleStartCampaign(campaign.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
