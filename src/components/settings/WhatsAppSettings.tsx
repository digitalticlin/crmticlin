
import { useState, useEffect } from "react";
import { useWhatsAppInstances } from "@/hooks/whatsapp/useWhatsAppInstance";
import WhatsAppInstanceCard from "./whatsapp/WhatsAppInstanceCard";
import PlaceholderInstanceCard from "./whatsapp/PlaceholderInstanceCard";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppSettings = () => {
  // Estado para armazenar o email do usuário atual
  const [userEmail, setUserEmail] = useState<string>("");
  
  // Carregar dados do usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erro ao obter usuário:", error);
        return;
      }
      
      if (user) {
        setUserEmail(user.email || "");
      }
    };
    
    getUser();
  }, []);
  
  const {
    instances,
    isLoading,
    instanceName,
    lastError,
    connectInstance,
    deleteInstance,
    refreshQrCode,
    showQrCode
  } = useWhatsAppInstances(userEmail);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-xl font-semibold">Gerenciamento de WhatsApp</h3>
        <p className="text-sm text-muted-foreground">
          Conecte e gerencie suas instâncias de WhatsApp
        </p>
      </div>
      
      <WhatsAppInfoAlert />
      
      {lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lastError}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        {instances.map(instance => (
          <WhatsAppInstanceCard 
            key={instance.id}
            instance={instance}
            isLoading={isLoading[instance.id] || false}
            showQrCode={showQrCode}
            onConnect={connectInstance}
            onDelete={deleteInstance}
            onRefreshQrCode={refreshQrCode}
          />
        ))}
        
        {/* Placeholder para adicional instância em planos superiores */}
        <PlaceholderInstanceCard />
      </div>
    </div>
  );
};

export default WhatsAppSettings;
