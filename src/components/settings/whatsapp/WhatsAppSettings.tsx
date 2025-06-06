
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebSection } from "./WhatsAppWebSection";

export const WhatsAppSettings = () => {
  // Agora buscar instâncias por created_by_user_id em vez de company_id
  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['whatsappInstances'],
    queryFn: async () => {
      // Buscar instâncias criadas pelo usuário atual
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });
      return data;
    },
  });

  console.log('[WhatsAppSettings] Component rendering - User-centric WhatsApp Web.js');
  console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
    instancesCount: instances?.length || 0,
    loading: isLoading
  });

  if (isLoading) {
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
          Gerencie suas conexões pessoais do WhatsApp Web.js
        </p>
      </div>

      {/* Seção Principal do WhatsApp Web.js */}
      <WhatsAppWebSection />
    </div>
  );
};
