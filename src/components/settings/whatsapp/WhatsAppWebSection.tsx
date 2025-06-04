
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";

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
      <WhatsAppWebSectionHeader
        onConnect={handleConnect}
        isConnecting={isConnecting}
        isLoading={isLoading}
        companyLoading={companyLoading}
      />

      {/* Instances Grid */}
      {isLoading || companyLoading ? (
        <WhatsAppWebLoadingState />
      ) : instances.length > 0 ? (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onRefreshQR={handleRefreshQR}
          onDelete={handleDeleteInstance}
          onShowQR={handleShowQR}
        />
      ) : (
        <WhatsAppWebEmptyState
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
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
