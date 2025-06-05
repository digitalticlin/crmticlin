
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstanceTestResult {
  step: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
  timestamp: string;
}

export const useInstanceCreationTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<InstanceTestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [createdInstanceId, setCreatedInstanceId] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Instance Creation Test] ${message}`);
  };

  const updateTestResult = (step: string, updates: Partial<InstanceTestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        return prev.map(r => r.step === step ? { ...r, ...updates } : r);
      } else {
        return [...prev, { step, success: false, duration: 0, timestamp: new Date().toISOString(), ...updates }];
      }
    });
  };

  const resetTest = () => {
    setTestResults([]);
    setLogs([]);
    setCreatedInstanceId(null);
  };

  const cleanupTestInstance = async () => {
    if (!createdInstanceId) {
      toast.error('Nenhuma instância de teste para limpar');
      return;
    }

    try {
      addLog(`🧹 Removendo instância de teste: ${createdInstanceId}`);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'delete_instance',
          instanceData: { instanceId: createdInstanceId }
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Falha ao remover instância');
      }

      addLog("✅ Instância de teste removida com sucesso");
      toast.success("Instância de teste removida");
      setCreatedInstanceId(null);

    } catch (error: any) {
      addLog(`❌ Erro ao remover instância: ${error.message}`);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  };

  return {
    isRunning,
    setIsRunning,
    testResults,
    logs,
    createdInstanceId,
    setCreatedInstanceId,
    addLog,
    updateTestResult,
    resetTest,
    cleanupTestInstance
  };
};
