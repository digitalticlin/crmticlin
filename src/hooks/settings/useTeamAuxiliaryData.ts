
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuxiliaryData {
  allWhatsApps: { id: string; instance_name: string }[];
  allFunnels: { id: string; name: string }[];
  auxDataLoading: boolean;
}

export const useTeamAuxiliaryData = (companyId: string | null): AuxiliaryData => {
  const [allWhatsApps, setAllWhatsApps] = useState<{ id: string; instance_name: string }[]>([]);
  const [allFunnels, setAllFunnels] = useState<{ id: string; name: string }[]>([]);
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

        // Buscar WhatsApp instances
        const { data: whatsapps, error: whatsappError } = await supabase
          .from("whatsapp_instances")
          .select("id, instance_name")
          .eq("company_id", companyId);

        if (isUnmountedRef.current) return;

        if (whatsappError) {
          console.error('[useTeamAuxiliaryData] Error fetching WhatsApp instances:', whatsappError);
        } else {
          setAllWhatsApps(whatsapps || []);
          console.log('[useTeamAuxiliaryData] WhatsApp instances loaded:', whatsapps?.length || 0);
        }

        // Buscar Funis
        const { data: funnels, error: funnelsError } = await supabase
          .from("funnels")
          .select("id, name")
          .eq("company_id", companyId);

        if (isUnmountedRef.current) return;

        if (funnelsError) {
          console.error('[useTeamAuxiliaryData] Error fetching funnels:', funnelsError);
        } else {
          setAllFunnels(funnels || []);
          console.log('[useTeamAuxiliaryData] Funnels loaded:', funnels?.length || 0);
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
