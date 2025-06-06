
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

    const instanceName = testInstanceName || `test_diagnostic_${Date.now()}`;
    
    try {
      addLog(`🚀 INICIANDO TESTE DIAGNÓSTICO COMPLETO: ${instanceName}`);

      // PASSO 1: Testar conectividade VPS PORTA 3001
      addLog("🔍 PASSO 1: Testando conectividade VPS (porta 3001)...");
      const step1Start = Date.now();
      
      try {
        // Testar diretamente na porta 3001
        const vpsHealthResponse = await fetch('http://31.97.24.222:3001/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer default-token'
          },
          signal: AbortSignal.timeout(10000)
        });

        const step1Duration = Date.now() - step1Start;
        
        if (!vpsHealthResponse.ok) {
          throw new Error(`VPS Health Check falhou: ${vpsHealthResponse.status}`);
        }

        const healthData = await vpsHealthResponse.json();
        addLog(`✅ VPS Online - Status: ${healthData.status}, Instâncias Ativas: ${healthData.activeInstances}`);
        
        updateTestResult('vps_connectivity', {
          success: true,
          duration: step1Duration,
          details: healthData,
          timestamp: new Date().toISOString()
        });

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

      // PASSO 2: Testar autenticação Edge Function
      addLog("🔐 PASSO 2: Testando autenticação Edge Function...");
      const step2Start = Date.now();
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Usuário não autenticado para Edge Function');
        }

        const step2Duration = Date.now() - step2Start;
        updateTestResult('edge_authentication', {
          success: true,
          duration: step2Duration,
          details: { userId: session.user.id, email: session.user.email },
          timestamp: new Date().toISOString()
        });
        addLog("✅ PASSO 2: Autenticação Edge Function OK");

      } catch (error: any) {
        const step2Duration = Date.now() - step2Start;
        updateTestResult('edge_authentication', {
          success: false,
          duration: step2Duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        addLog(`❌ PASSO 2: ${error.message}`);
        throw error;
      }

      // PASSO 3: Testar criação via Edge Function (CORRIGIDA PARA PORTA 3001)
      addLog(`📱 PASSO 3: Criando instância via Edge Function (PORTA 3001): ${instanceName}...`);
      const step3Start = Date.now();
      
      try {
        const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp_web_server', {
          body: { 
            action: 'create_instance',
            instanceData: { instanceName }
          }
        });

        const step3Duration = Date.now() - step3Start;

        addLog(`📋 Resposta Edge Function: ${JSON.stringify(createData, null, 2)}`);
        
        if (createError) {
          addLog(`❌ Erro Supabase Functions: ${JSON.stringify(createError, null, 2)}`);
          throw new Error(createError.message || 'Erro na invocação da Edge Function');
        }

        if (!createData || !createData.success) {
          const errorMsg = createData?.error || 'Edge Function retornou erro';
          addLog(`❌ Edge Function erro: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        const instanceId = createData.instance?.id;
        if (!instanceId) {
          addLog(`❌ ID da instância não retornado pela Edge Function`);
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
        addLog(`✅ PASSO 3: Instância criada via Edge Function - ID: ${instanceId}`);

        // PASSO 4: Verificar QR Code via VPS DIRETAMENTE (PORTA 3001)
        if (createData.instance?.qr_code) {
          addLog("✅ PASSO 4A: QR Code já disponível na criação!");
          updateTestResult('immediate_qr_code', {
            success: true,
            duration: 0,
            details: { qrCodeLength: createData.instance.qr_code.length },
            timestamp: new Date().toISOString()
          });
        } else {
          addLog("⏳ PASSO 4A: QR Code não disponível imediatamente - testando VPS diretamente...");
          
          const vpsInstanceId = createData.instance?.vps_instance_id;
          if (vpsInstanceId) {
            try {
              // Testar VPS diretamente na porta 3001
              const qrResponse = await fetch(`http://31.97.24.222:3001/instance/${vpsInstanceId}/qr`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer default-token'
                },
                signal: AbortSignal.timeout(10000)
              });

              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                addLog(`📱 VPS QR Response: ${JSON.stringify(qrData, null, 2)}`);
                
                if (qrData.success && qrData.qrCode) {
                  addLog("✅ QR Code obtido diretamente da VPS!");
                  updateTestResult('direct_vps_qr', {
                    success: true,
                    duration: 0,
                    details: { qrCodeLength: qrData.qrCode.length },
                    timestamp: new Date().toISOString()
                  });
                } else {
                  addLog("⏳ QR Code ainda não disponível na VPS - iniciando polling...");
                  await pollForQRCode(instanceId, addLog, updateTestResult);
                }
              } else {
                addLog(`⚠️ VPS QR Endpoint não acessível: ${qrResponse.status}`);
                await pollForQRCode(instanceId, addLog, updateTestResult);
              }
            } catch (vpsError: any) {
              addLog(`⚠️ Erro ao acessar VPS diretamente: ${vpsError.message}`);
              await pollForQRCode(instanceId, addLog, updateTestResult);
            }
          } else {
            addLog("❌ VPS Instance ID não disponível");
          }
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

      addLog("🎉 TESTE DIAGNÓSTICO CONCLUÍDO COM SUCESSO!");
      toast.success("Teste diagnóstico concluído com sucesso!");

    } catch (error: any) {
      addLog(`💥 Teste falhou: ${error.message}`);
      toast.error(`Teste diagnóstico falhou: ${error.message}`);
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
