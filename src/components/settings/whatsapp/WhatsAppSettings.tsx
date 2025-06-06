
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebSection } from "./WhatsAppWebSection";

export const WhatsAppSettings = () => {
  // Buscar TODAS as instâncias (sem filtros de usuário)
  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['whatsappInstances'],
    queryFn: async () => {
      console.log('[WhatsAppSettings] 🔓 ACESSO TOTAL - buscando todas as instâncias');
      
      // Buscar TODAS as instâncias sem filtros
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });
      
      console.log('[WhatsAppSettings] ✅ Instâncias encontradas (ACESSO TOTAL):', data?.length || 0);
      return data || [];
    },
  });

  console.log('[WhatsAppSettings] 🔓 Component rendering - ACESSO TOTAL LIBERADO');
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
          Gerencie suas conexões do WhatsApp Web.js (ACESSO TOTAL LIBERADO)
        </p>
      </div>

      <WhatsAppWebSection />
    </div>
  );
};
