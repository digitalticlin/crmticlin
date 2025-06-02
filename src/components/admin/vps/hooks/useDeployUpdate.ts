
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeployResults } from "../types/versionDiagnosticTypes";

export const useDeployUpdate = (checkVersion: () => Promise<void>) => {
  const [deploying, setDeploying] = useState(false);
  const [deployResults, setDeployResults] = useState<DeployResults | null>(null);

  const deployUpdate = async () => {
    try {
      setDeploying(true);
      setDeployResults(null);
      toast.info("🚀 Iniciando deploy automatizado...");

      const { data, error } = await supabase.functions.invoke('vps_auto_deploy', {
        body: { action: 'deploy' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setDeployResults(data);
      
      if (data.success) {
        toast.success("✅ Deploy concluído! Aguarde 30s e teste novamente.");
        
        setTimeout(() => {
          checkVersion();
        }, 30000);
      } else {
        throw new Error('Deploy falhou');
      }

    } catch (error: any) {
      console.error('Erro no deploy:', error);
      toast.error(`❌ Falha no deploy: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  return {
    deploying,
    deployResults,
    deployUpdate
  };
};
