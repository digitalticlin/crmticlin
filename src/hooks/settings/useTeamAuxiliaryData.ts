
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Query Keys isolados para useTeamAuxiliaryData (preparado para futura migração para React Query)
export const TEAM_AUXILIARY_KEYS = {
  whatsapp: (companyId: string | null) => ['teamWhatsappInstances', companyId] as const,
  funnels: (companyId: string | null) => ['teamFunnels', companyId] as const,
  all: (companyId: string | null) => ['teamAuxiliaryData', companyId] as const,
} as const;

interface AuxiliaryData {
  allWhatsApps: { id: string; instance_name: string }[];
  allFunnels: { id: string; name: string }[];
  auxDataLoading: boolean;
}

// Explicit types for the database responses
type WhatsAppInstance = {
  id: string;
  instance_name: string;
};

type Funnel = {
  id: string;
  name: string;
};

export const useTeamAuxiliaryData = (companyId: string | null): AuxiliaryData => {
  const [allWhatsApps, setAllWhatsApps] = useState<WhatsAppInstance[]>([]);
  const [allFunnels, setAllFunnels] = useState<Funnel[]>([]);
  const [auxDataLoading, setAuxDataLoading] = useState(false);
  
  // Refs para controlar execuções
  const auxDataLoadedRef = useRef<boolean>(false);
  const isUnmountedRef = useRef<boolean>(false);

  // Cleanup no desmonte
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      console.log('[useTeamAuxiliaryData] Component unmounting');
    };
  }, []);

  // Buscar dados auxiliares apenas UMA vez quando companyId estiver disponível
  useEffect(() => {
    if (!companyId || auxDataLoadedRef.current || isUnmountedRef.current) {
      console.log('[useTeamAuxiliaryData] Skipping aux data fetch - no companyId or already loaded');
      return;
    }

    const fetchAuxData = async (): Promise<void> => {
      try {
        console.log('[useTeamAuxiliaryData] Fetching auxiliary data for company:', companyId);
        setAuxDataLoading(true);
        auxDataLoadedRef.current = true;

        // Buscar WhatsApp instances with simple query
        try {
          const { data: whatsappData, error: whatsappError } = await supabase
            .from("whatsapp_instances")
            .select("id, instance_name")
            .eq("created_by_user_id", companyId);

          if (isUnmountedRef.current) return;

          if (whatsappError) {
            console.error('[useTeamAuxiliaryData] Error fetching WhatsApp instances:', whatsappError);
          } else {
            setAllWhatsApps(whatsappData || []);
            console.log('[useTeamAuxiliaryData] WhatsApp instances loaded:', whatsappData?.length || 0);
          }
        } catch (whatsappErr) {
          console.error('[useTeamAuxiliaryData] WhatsApp query error:', whatsappErr);
        }

        // Buscar Funis with simple query
        try {
          const { data: funnelsData, error: funnelsError } = await supabase
            .from("funnels")
            .select("id, name")
            .eq("created_by_user_id", companyId);

          if (isUnmountedRef.current) return;

          if (funnelsError) {
            console.error('[useTeamAuxiliaryData] Error fetching funnels:', funnelsError);
          } else {
            setAllFunnels(funnelsData || []);
            console.log('[useTeamAuxiliaryData] Funnels loaded:', funnelsData?.length || 0);
          }
        } catch (funnelsErr) {
          console.error('[useTeamAuxiliaryData] Funnels query error:', funnelsErr);
        }
      } catch (error) {
        if (!isUnmountedRef.current) {
          console.error('[useTeamAuxiliaryData] Error in fetchAuxData:', error);
        }
      } finally {
        if (!isUnmountedRef.current) {
          setAuxDataLoading(false);
        }
      }
    };

    void fetchAuxData();
  }, [companyId]);

  return {
    allWhatsApps,
    allFunnels,
    auxDataLoading
  };
};
