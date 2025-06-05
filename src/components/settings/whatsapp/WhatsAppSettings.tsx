
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { WhatsAppWebSection } from "./WhatsAppWebSection";

export const WhatsAppSettings = () => {
  const { companyId, loading: companyLoading } = useCompanyData();

  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['whatsappInstances', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!companyId,
  });

  console.log('[WhatsAppSettings] Component rendering - WhatsApp Web.js only');
  console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
    instancesCount: instances?.length || 0,
    loading: isLoading,
    companyLoading
  });

  if (companyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas conexões do WhatsApp Web.js
        </p>
      </div>

      {/* Seção Principal do WhatsApp Web.js */}
      <WhatsAppWebSection />
    </div>
  );
};
