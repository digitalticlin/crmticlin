
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VersionInfo } from "../types/versionDiagnosticTypes";

export const useVersionCheck = () => {
  const [checking, setChecking] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  const checkVersion = async () => {
    try {
      setChecking(true);
      toast.info("🔍 Verificando versão do servidor VPS através do edge function...");

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'check_server',
          instanceData: {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data) {
        const serverData = data.data;
        setVersionInfo({
          server: serverData.server || 'WhatsApp Web.js Server',
          version: serverData.version || 'unknown',
          hash: serverData.hash || 'not-available',
          timestamp: serverData.timestamp || new Date().toISOString(),
          status: 'online',
          endpoints_available: serverData.endpoints_available || []
        });
        
        toast.success(`✅ Servidor VPS v${serverData.version} detectado!`);
      } else {
        throw new Error('Resposta inválida do servidor');
      }

    } catch (error: any) {
      console.error('Erro ao verificar versão:', error);
      
      setVersionInfo({
        server: 'Erro de Conexão',
        version: 'N/A',
        timestamp: new Date().toISOString(),
        status: 'offline'
      });
      
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  return {
    checking,
    versionInfo,
    checkVersion
  };
};
