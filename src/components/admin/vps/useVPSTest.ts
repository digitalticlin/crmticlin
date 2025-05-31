
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResults {
  success: boolean;
  results?: {
    connectivity?: {
      ping_test: boolean;
      http_test: boolean;
    };
    next_steps?: string[];
  };
  scripts?: {
    install?: string;
    server?: string;
    package?: string;
  };
}

export const useVPSTest = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  const runConnectivityTest = async () => {
    try {
      setTesting(true);
      toast.info("Iniciando teste de conectividade VPS...");

      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setTestResults(data);
      
      if (data.success) {
        toast.success("Teste de conectividade concluído!");
      } else {
        toast.error(`Falha no teste: ${data.error}`);
      }

    } catch (error: any) {
      console.error('Erro no teste VPS:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return {
    testing,
    testResults,
    runConnectivityTest
  };
};
