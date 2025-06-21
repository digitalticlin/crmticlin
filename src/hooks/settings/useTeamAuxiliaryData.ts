
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

        // Buscar WhatsApp instances without type assertion
        const whatsappQuery = await supabase
          .from("whatsapp_instances")
          .select("id, instance_name")
          .eq("company_id", companyId);

        if (isUnmountedRef.current) return;

        if (whatsappQuery.error) {
          console.error('[useTeamAuxiliaryData] Error fetching WhatsApp instances:', whatsappQuery.error);
        } else {
          setAllWhatsApps(whatsappQuery.data || []);
          console.log('[useTeamAuxiliaryData] WhatsApp instances loaded:', whatsappQuery.data?.length || 0);
        }

        // Buscar Funis without type assertion
        const funnelsQuery = await supabase
          .from("funnels")
          .select("id, name")
          .eq("company_id", companyId);

        if (isUnmountedRef.current) return;

        if (funnelsQuery.error) {
          console.error('[useTeamAuxiliaryData] Error fetching funnels:', funnelsQuery.error);
        } else {
          setAllFunnels(funnelsQuery.data || []);
          console.log('[useTeamAuxiliaryData] Funnels loaded:', funnelsQuery.data?.length || 0);
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
