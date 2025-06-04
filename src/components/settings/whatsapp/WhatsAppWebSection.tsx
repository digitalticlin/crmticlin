import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Component rendering - WhatsApp Web.js only');
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [localShowQRModal, setLocalShowQRModal] = useState(false);
  const [localSelectedQRCode, setLocalSelectedQRCode] = useState<string | null>(null);
  const [localSelectedInstanceName, setLocalSelectedInstanceName] = useState<string>('');
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    isLoading,
    isConnecting,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  // Load current user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
          toast.error("Could not load user data");
          return;
        }
        if (user) {
          setUserEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("An error occurred while loading user data");
      }
    };
    getUser();
  }, []);

  // FASE 3.1.3: handleConnect com nomenclatura inteligente
  const handleConnect = async () => {
    console.log('[WhatsAppWebSection] Connect requested - FASE 3.1.3 (nomenclatura inteligente)');
    
    // FASE 3.1.3: Gerar nome inteligente baseado no email do usuário
    const instanceName = await generateIntelligentInstanceName(userEmail);
    console.log('[WhatsAppWebSection] 🎯 Nome inteligente gerado:', instanceName);
    
    try {
      // Criar instância e capturar resultado com QR Code
      const createdInstance = await createInstance(instanceName);
      
      if (createdInstance && createdInstance.qr_code) {
        console.log('[WhatsAppWebSection] ✅ QR Code capturado da criação:', createdInstance.qr_code.substring(0, 50) + '...');
        
        // Abrir modal automaticamente com QR Code
        setLocalSelectedQRCode(createdInstance.qr_code);
        setLocalSelectedInstanceName(createdInstance.instance_name);
        setLocalShowQRModal(true);
        
        toast.success(`Instância "${instanceName}" criada! Escaneie o QR Code para conectar.`);
      } else {
        console.log('[WhatsAppWebSection] ⚠️ Instância criada mas sem QR Code imediato');
        toast.success(`Instância "${instanceName}" criada! Use o botão "Ver QR" para conectar.`);
      }
    } catch (error) {
      console.error('[WhatsAppWebSection] ❌ Erro na criação:', error);
      // Toast de erro já é exibido pelo createInstance
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Refreshing QR code for instance:', instanceId);
    const result = await refreshQRCode(instanceId);
    
    if (result.success && result.qrCode) {
      const instance = instances.find(i => i.id === instanceId);
      setLocalSelectedQRCode(result.qrCode);
      setLocalSelectedInstanceName(instance?.instance_name || '');
      setLocalShowQRModal(true);
    }
  };

  const handleShowQR = (instance: any) => {
    if (instance.qr_code) {
      setLocalSelectedQRCode(instance.qr_code);
      setLocalSelectedInstanceName(instance.instance_name);
      setLocalShowQRModal(true);
    }
  };

  const closeQRModal = () => {
    setLocalShowQRModal(false);
    setLocalSelectedQRCode(null);
    setLocalSelectedInstanceName('');
  };

  return (
    <div className="space-y-6">
      {/* Title Card with Add Button */}
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Instâncias WhatsApp</h3>
              <p className="text-gray-600 mt-1">Conecte e gerencie suas conexões do WhatsApp</p>
            </div>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting || isLoading || companyLoading}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>Adicionar WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instances Grid */}
      {isLoading || companyLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-sm text-gray-600">Carregando instâncias...</p>
          </div>
        </div>
      ) : instances.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {instances.map((instance) => (
            <WhatsAppWebInstanceCard
              key={instance.id}
              instance={instance}
              onRefreshQR={handleRefreshQR}
              onDelete={handleDeleteInstance}
              onShowQR={() => handleShowQR(instance)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma instância conectada</h3>
            <p className="text-gray-600 mb-6">Conecte seu primeiro WhatsApp para começar a usar o sistema</p>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  <span>Conectar WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <ImprovedQRCodeModal
        isOpen={localShowQRModal}
        onOpenChange={(open) => !open && closeQRModal()}
        qrCodeUrl={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
      />
    </div>
  );
};
