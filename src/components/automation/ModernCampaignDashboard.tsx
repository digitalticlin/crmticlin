
import { useState } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Users, 
  MessageCircle, 
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { useBroadcastCampaigns } from "@/hooks/broadcast/useBroadcastCampaigns";
import { ModernCampaignCard } from "./ModernCampaignCard";

export function ModernCampaignDashboard() {
  const { campaigns, loading, startCampaign } = useBroadcastCampaigns();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcular métricas
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.total_recipients, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <ModernCard key={i} className="animate-pulse">
            <ModernCardContent className="p-6">
              <div className="h-4 bg-white/20 rounded mb-4"></div>
              <div className="h-8 bg-white/20 rounded"></div>
            </ModernCardContent>
          </ModernCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ModernCard className="bg-gradient-to-br from-blue-500/20 to-blue-600/20">
          <ModernCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Campanhas</p>
                <p className="text-2xl font-bold text-white">{totalCampaigns}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-200" />
            </div>
          </ModernCardContent>
        </ModernCard>

        <ModernCard className="bg-gradient-to-br from-green-500/20 to-green-600/20">
          <ModernCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Ativas</p>
                <p className="text-2xl font-bold text-white">{activeCampaigns}</p>
              </div>
              <Play className="w-8 h-8 text-green-200" />
            </div>
          </ModernCardContent>
        </ModernCard>

        <ModernCard className="bg-gradient-to-br from-purple-500/20 to-purple-600/20">
          <ModernCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Enviadas</p>
                <p className="text-2xl font-bold text-white">{totalSent.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-200" />
            </div>
          </ModernCardContent>
        </ModernCard>

        <ModernCard className="bg-gradient-to-br from-orange-500/20 to-orange-600/20">
          <ModernCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Alcance</p>
                <p className="text-2xl font-bold text-white">{totalRecipients.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-orange-200" />
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>

      {/* Filtros */}
      <ModernCard>
        <ModernCardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 border-white/20"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white/50 border-white/20">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
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

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <ModernCard>
            <ModernCardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {searchTerm || statusFilter !== "all" ? "Nenhuma campanha encontrada" : "Nenhuma campanha criada"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece criando sua primeira campanha de disparo em massa"
                }
              </p>
            </ModernCardContent>
          </ModernCard>
        ) : (
          filteredCampaigns.map((campaign) => (
            <ModernCampaignCard
              key={campaign.id}
              campaign={campaign}
              onStart={() => startCampaign(campaign.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
