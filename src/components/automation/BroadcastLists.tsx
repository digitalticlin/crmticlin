
import React, { useState } from 'react';
import { BroadcastCampaignCard } from './BroadcastCampaignCard';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const BroadcastLists = () => {
  const { campaigns, loading, startCampaign, fetchCampaigns } = useBroadcastCampaigns();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.message_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStartCampaign = async (campaignId: string) => {
    const success = await startCampaign(campaignId);
    if (success) {
      await fetchCampaigns();
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    // TODO: Implementar pausa de campanha
    toast.info('Função de pausar campanha será implementada em breve');
  };

  const handleViewDetails = (campaignId: string) => {
    // TODO: Implementar visualização de detalhes
    toast.info('Detalhes da campanha serão implementados em breve');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando campanhas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="running">Executando</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {campaigns.length === 0 
              ? 'Nenhuma campanha criada ainda. Crie sua primeira campanha na aba "Nova Transmissão".'
              : 'Nenhuma campanha encontrada com os filtros aplicados.'
            }
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <BroadcastCampaignCard
              key={campaign.id}
              campaign={campaign}
              onStart={handleStartCampaign}
              onPause={handlePauseCampaign}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
