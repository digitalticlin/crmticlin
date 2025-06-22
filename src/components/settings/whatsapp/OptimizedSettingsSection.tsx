
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CreateInstanceButton } from "@/modules/whatsapp/instanceCreation/components/CreateInstanceButton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { useQRCodeManagement } from "@/modules/whatsapp/qrCodeManagement/hooks/useQRCodeManagement";
import { QRCodeModal } from "@/modules/whatsapp/qrCodeManagement/components/QRCodeModal";

export const OptimizedSettingsSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openQRModal, closeQRModal, requestQRCode, getQRState } = useQRCodeManagement();

  // Buscar instâncias apenas para listagem
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['whatsapp-instances', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OptimizedSettings] Erro ao buscar instâncias:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  const handleInstanceCreated = async (result: any) => {
    console.log('[OptimizedSettings] ✅ Instância criada via estrutura modular:', result);
    
    // Atualizar lista de instâncias
    queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
    
    // CORREÇÃO: Abrir modal QR automaticamente após criação
    if (result.instance?.id) {
      console.log('[OptimizedSettings] 📱 Abrindo modal QR automaticamente:', result.instance.id);
      // Delay para garantir que a instância aparece na lista
      setTimeout(() => {
        openQRModal(result.instance.id);
      }, 1000);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      console.log('[OptimizedSettings] 🗑️ Deletando instância:', instanceId);
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId)
        .eq('created_by_user_id', user?.id);

      if (error) throw error;

      // Atualizar lista
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      
    } catch (error: any) {
      console.error('[OptimizedSettings] ❌ Erro ao deletar:', error);
    }
  };

  const handleGenerateQR = async (instanceId: string) => {
    console.log('[OptimizedSettings] 📱 Gerando QR Code via nova estrutura:', instanceId);
    openQRModal(instanceId);
  };

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando WhatsApp Settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão principal para criar instância usando estrutura modular */}
      <div className="flex justify-center">
        <CreateInstanceButton 
          onSuccess={handleInstanceCreated}
          variant="whatsapp"
          size="lg"
          className="px-8 py-3 text-lg"
        />
      </div>

      {/* Grid de instâncias ou estado vazio */}
      {instances.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Suas Instâncias WhatsApp ({instances.length})
            </h3>
            <CreateInstanceButton 
              onSuccess={handleInstanceCreated}
              variant="outline"
              size="sm"
              className="text-sm"
            />
          </div>
          
          <WhatsAppInstanceGrid 
            instances={instances}
            onDelete={handleDeleteInstance}
            onRefreshQR={handleGenerateQR}
          />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-green-300 bg-green-50/30">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhuma instância WhatsApp
            </h3>
            <p className="text-gray-600 mb-6">
              Conecte sua primeira instância para começar a usar o sistema
            </p>
            <CreateInstanceButton 
              onSuccess={handleInstanceCreated}
              variant="whatsapp"
              size="default"
            />
          </CardContent>
        </Card>
      )}

      {/* Modais QR para todas as instâncias */}
      {instances.map((instance) => {
        const qrState = getQRState(instance.id);
        return (
          <QRCodeModal
            key={instance.id}
            isOpen={qrState.isModalOpen}
            onClose={() => closeQRModal(instance.id)}
            qrCode={qrState.qrCode}
            isLoading={qrState.isLoading}
            error={qrState.error}
            instanceName={instance.instance_name}
            onRetry={() => requestQRCode(instance.id)}
          />
        );
      })}

      {/* Card informativo sobre estrutura modular */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>✅ ESTRUTURA MODULAR ISOLADA IMPLEMENTADA:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Criação:</strong> Módulo isolado (instanceCreation)</li>
              <li><strong>QR Code:</strong> Módulo isolado (qrCodeManagement)</li>
              <li><strong>Webhook:</strong> Edge Function webhook_qr_receiver</li>
              <li><strong>Solicitação QR:</strong> Edge Function whatsapp_qr_manager</li>
              <li><strong>Modal Auto:</strong> Abre automaticamente após criação</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
              <p className="font-medium">🎯 Fluxo Isolado QR Code:</p>
              <p>1. Criação → Modal auto → whatsapp_qr_manager</p>
              <p>2. VPS → Webhook → webhook_qr_receiver</p>
              <p>3. Real-time → Modal atualizado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
