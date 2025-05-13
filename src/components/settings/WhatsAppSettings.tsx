
import { useState, useEffect } from "react";
import { useWhatsAppInstances } from "@/hooks/whatsapp/useWhatsAppInstance";
import WhatsAppInstanceCard from "./whatsapp/WhatsAppInstanceCard";
import PlaceholderInstanceCard from "./whatsapp/PlaceholderInstanceCard";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WhatsAppSettings = () => {
  // Estado para armazenar o email do usuário atual
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Carregar dados do usuário atual
  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Erro ao obter usuário:", error);
          toast.error("Não foi possível carregar os dados do usuário");
          return;
        }
        
        if (user) {
          setUserEmail(user.email || "");
          
          // Verificar se o usuário é um SuperAdmin
          const { data: superAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
          if (!superAdminError) {
            setIsSuperAdmin(superAdmin || false);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        toast.error("Ocorreu um erro ao carregar dados do usuário");
      } finally {
        setIsLoading(false);
      }
    };
    
    getUser();
  }, []);
  
  const {
    instances,
    isLoading: instanceLoading,
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
            isLoading={instanceLoading[instance.id] || false}
            showQrCode={showQrCode}
            onConnect={connectInstance}
            onDelete={deleteInstance}
            onRefreshQrCode={refreshQrCode}
          />
        ))}
        
        {/* Placeholder para adicionar nova instância - mostrado para SuperAdmin ou usuários com plano adequado */}
        <PlaceholderInstanceCard isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  );
};

export default WhatsAppSettings;
