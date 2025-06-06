
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InstanceCreationTestControls } from "./components/InstanceCreationTestControls";
import { TestResultsDisplay } from "./components/TestResultsDisplay";
import { TestLogsDisplay } from "./components/TestLogsDisplay";
import { useInstanceCreationTest } from "./hooks/useInstanceCreationTest";
import { useQRCodePolling } from "./hooks/useQRCodePolling";

export const VPSInstanceCreationTester = () => {
  const [testInstanceName, setTestInstanceName] = useState('');
  const [qrCodePolling, setQrCodePolling] = useState(false);

  const {
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
  } = useInstanceCreationTest();

  const { pollForQRCode } = useQRCodePolling(setQrCodePolling);

  const runInstanceCreationTest = async () => {
    setIsRunning(true);
    resetTest();

    const instanceName = testInstanceName || `test_instance_${Date.now()}`;
    
    try {
      addLog(`🚀 Iniciando teste de criação de instância (CORREÇÃO ROBUSTA): ${instanceName}`);

      // PASSO 1: Testar conectividade VPS
      addLog("🔍 PASSO 1: Testando conectividade VPS...");
      const step1Start = Date.now();
      
      try {
        const { data: connectivityData, error: connectivityError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_connectivity' }
        });

        const step1Duration = Date.now() - step1Start;

        if (connectivityError || !connectivityData.success) {
          throw new Error(connectivityData?.error || connectivityError?.message || 'Conectividade falhou');
        }

        updateTestResult('vps_connectivity', {
          success: true,
          duration: step1Duration,
          details: connectivityData.details,
          timestamp: new Date().toISOString()
        });
        addLog("✅ PASSO 1: VPS acessível");

      } catch (error: any) {
        const step1Duration = Date.now() - step1Start;
        updateTestResult('vps_connectivity', {
          success: false,
          duration: step1Duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        addLog(`❌ PASSO 1: ${error.message}`);
        throw error;
      }

      // PASSO 2: Testar autenticação VPS
      addLog("🔐 PASSO 2: Testando autenticação VPS...");
      const step2Start = Date.now();
      
      try {
        const { data: authData, error: authError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_auth' }
        });

        const step2Duration = Date.now() - step2Start;

        if (authError || !authData.success) {
          throw new Error(authData?.error || authError?.message || 'Autenticação falhou');
        }

        updateTestResult('vps_authentication', {
          success: true,
          duration: step2Duration,
          details: authData.details,
          timestamp: new Date().toISOString()
        });
        addLog("✅ PASSO 2: Autenticação OK");

      } catch (error: any) {
        const step2Duration = Date.now() - step2Start;
        updateTestResult('vps_authentication', {
          success: false,
          duration: step2Duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        addLog(`❌ PASSO 2: ${error.message}`);
        throw error;
      }

      // PASSO 3: Criar instância WhatsApp
      addLog(`📱 PASSO 3: Criando instância WhatsApp (CORREÇÃO ROBUSTA): ${instanceName}...`);
      const step3Start = Date.now();
      
      try {
        const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp_web_server', {
          body: { 
            action: 'create_instance',
            instanceData: { instanceName }
          }
        });

        const step3Duration = Date.now() - step3Start;

        addLog(`📋 Resposta completa da criação: ${JSON.stringify(createData, null, 2)}`);
        
        if (createError) {
          addLog(`❌ Erro do Supabase: ${JSON.stringify(createError, null, 2)}`);
          throw new Error(createError.message || 'Erro na invocação da função');
        }

        if (!createData || !createData.success) {
          const errorMsg = createData?.error || 'Resposta de erro da função';
          addLog(`❌ Função retornou erro: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        const instanceId = createData.instance?.id;
        if (!instanceId) {
          addLog(`❌ ID da instância não encontrado na resposta`);
          throw new Error('ID da instância não retornado');
        }
        
        setCreatedInstanceId(instanceId);

        updateTestResult('instance_creation', {
          success: true,
          duration: step3Duration,
          details: {
            instanceId: instanceId,
            hasImmediateQR: !!createData.instance?.qr_code,
            vpsInstanceId: createData.instance?.vps_instance_id,
            connectionStatus: createData.instance?.connection_status,
            webStatus: createData.instance?.web_status,
            instanceName: createData.instance?.instance_name
          },
          timestamp: new Date().toISOString()
        });
        addLog(`✅ PASSO 3: Instância criada com sucesso - ID: ${instanceId}`);

        // PASSO 4: Verificar QR Code
        if (createData.instance?.qr_code) {
          addLog("✅ PASSO 4A: QR Code já disponível na criação!");
          updateTestResult('immediate_qr_code', {
            success: true,
            duration: 0,
            details: { qrCodeLength: createData.instance.qr_code.length },
            timestamp: new Date().toISOString()
          });
        } else {
          addLog("⏳ PASSO 4A: QR Code não disponível imediatamente - iniciando polling ROBUSTO!");
          updateTestResult('immediate_qr_code', {
            success: true,
            duration: 0,
            details: { message: "QR Code será gerado assincronamente" },
            timestamp: new Date().toISOString()
          });
          
          await pollForQRCode(instanceId, addLog, updateTestResult);
        }

      } catch (error: any) {
        const step3Duration = Date.now() - step3Start;
        addLog(`❌ Erro detalhado no PASSO 3: ${error.message}`);
        
        updateTestResult('instance_creation', {
          success: false,
          duration: step3Duration,
          error: error.message,
          details: { fullError: error },
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      addLog("🎉 Teste de criação de instância concluído com sucesso (CORREÇÃO ROBUSTA)!");
      toast.success("Teste de instância concluído com sucesso!");

    } catch (error: any) {
      addLog(`💥 Teste falhou: ${error.message}`);
      toast.error(`Teste de instância falhou: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <InstanceCreationTestControls
        testInstanceName={testInstanceName}
        setTestInstanceName={setTestInstanceName}
        isRunning={isRunning}
        qrCodePolling={qrCodePolling}
        createdInstanceId={createdInstanceId}
        onRunTest={runInstanceCreationTest}
        onCleanupTest={cleanupTestInstance}
      />

      <TestResultsDisplay testResults={testResults} />

      <TestLogsDisplay logs={logs} />
    </div>
  );
};
