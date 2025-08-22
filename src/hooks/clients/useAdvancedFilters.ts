import { useState, useEffect } from 'react';
import { useQuery } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast"

interface FilterOption {
  id: string;
  name: string;
}

interface UseAdvancedFiltersProps {
  initialFunnelId?: string | null;
  initialTeamMemberIds?: string[];
}

export const useAdvancedFilters = ({ initialFunnelId, initialTeamMemberIds }: UseAdvancedFiltersProps = {}) => {
  const [funnelId, setFunnelId] = useState<string | null>(initialFunnelId || null);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>(initialTeamMemberIds || []);
  const [funnels, setFunnels] = useState<FilterOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<FilterOption[]>([]);
  const { toast } = useToast()

  // Fetch funnels
  const { data: funnelsData, error: funnelsError, isLoading: isLoadingFunnels } = useQuery(
    'funnels',
    async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, name');

      if (error) {
        console.error("Funnels error", error)
        toast({
          title: "Houve um problema ao carregar os funis.",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        })
        throw error;
      }

      return data;
    }
  );

  // Fetch team members
  const { data: teamMembersData, error: teamMembersError, isLoading: isLoadingTeamMembers } = useQuery(
    'teamMembers',
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name');

      if (error) {
        console.error("teamMembers error", error)
        toast({
          title: "Houve um problema ao carregar os membros do time.",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        })
        throw error;
      }

      return data;
    }
  );

  useEffect(() => {
    if (funnelsData) {
      setFunnels(
        funnelsData.map((funnel: any) => ({
          id: funnel.id,
          name: funnel.name,
        }))
      );
    }
  }, [funnelsData]);

  useEffect(() => {
    if (teamMembersData) {
      setTeamMembers(
        teamMembersData
.map((member: any) => ({
  id: member?.id || '',
  name: member?.name || member?.title || 'Unknown'
}))
      );
    }
  }, [teamMembersData]);

  const handleFunnelChange = (newFunnelId: string | null) => {
    setFunnelId(newFunnelId);
  };

  const handleTeamMembersChange = (newTeamMemberIds: string[]) => {
    setTeamMemberIds(newTeamMemberIds);
  };

  const availableFunnels = funnels.map((funnel: any) => ({
  id: funnel.id,
  name: funnel.name || funnel.title || 'Unknown'
}));

  return {
    funnelId,
    teamMemberIds,
    funnels: availableFunnels,
    teamMembers,
    handleFunnelChange,
    handleTeamMembersChange,
    isLoading: isLoadingFunnels || isLoadingTeamMembers,
  };
};
