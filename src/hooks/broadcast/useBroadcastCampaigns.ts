
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BroadcastCampaign } from "@/types/broadcast";

// Export the type for other components to use
export { BroadcastCampaign } from "@/types/broadcast";

export function useBroadcastCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCampaigns = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Simular carregamento de campanhas
      const mockCampaigns: BroadcastCampaign[] = [
        {
          id: '1',
          name: 'Campanha Exemplo',
          message_text: 'Mensagem de exemplo',
          target_type: 'all',
          target_config: {},
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by_user_id: user.id,
          rate_limit_per_minute: 2,
          business_hours_only: false,
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCampaign = async (campaignId: string) => {
    console.log('Starting campaign:', campaignId);
    // Implementar lógica de início de campanha
  };

  const fetchCampaigns = async () => {
    await loadCampaigns();
  };

  useEffect(() => {
    loadCampaigns();
  }, [user?.id]);

  return {
    campaigns,
    isLoading,
    loading: isLoading, // Alias for compatibility
    refetch: loadCampaigns,
    startCampaign,
    fetchCampaigns,
  };
}
