
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  Search,
  Smartphone
} from "lucide-react";

interface CreatedInstance {
  id: string;
  instance_name: string;
  vps_instance_id: string;
  connection_status: string;
  web_status: string;
  created_at: string;
}

export const ManualWhatsAppInstanceCreator = () => {
  const [instanceName, setInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [createdInstance, setCreatedInstance] = useState<CreatedInstance | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);

  const runVPSDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryResults(null);
    
    try {
      console.log('[Manual Creator] 🔍 Testando VPS...');
      
      const { data, error } = await supabase.functions.invoke('vps_discovery');

      if (error) {
        throw new Error(error.message);
      }

      setDiscoveryResults(data);
      
      if (data.success && data.summary.workingEndpoints > 0) {
        toast.success(`VPS funcionando! ${data.summary.workingEndpoints} endpoints ativos`, {
          description: `Configuração: ${data.recommendation?.config}`
        });
      } else {
        toast.warning('VPS não respondeu', {
          description: 'Verifique se a VPS está online'
        });
      }

    } catch (error: any) {
      console.error('[Manual Creator] ❌ Erro na descoberta:', error);
      toast.error('Erro ao testar VPS', {
        description: error.message
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setIsCreating(true);
    setCreatedInstance(null);
    setQrCodeUrl(null);
    
    try {
      console.log('[Manual Creator] 🆕 ETAPA 1: Criando instância...', instanceName);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName.trim()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao criar instância');
      }

      setCreatedInstance(data.instance);
      toast.success('Instância criada com sucesso!', {
        description: `ID: ${data.instance.vps_instance_id}`
      });

      console.log('[Manual Creator] ✅ Instância criada:', data.instance);

    } catch (error: any) {
      console.error('[Manual Creator] ❌ Erro na criação:', error);
      toast.error('Erro ao criar instância', {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  const generateQR = async () => {
    if (!createdInstance) {
      toast.error('Crie uma instância primeiro');
      return;
    }

    setIsGeneratingQR(true);
    setQrCodeUrl(null);
    
    try {
      console.log('[Manual Creator] 🔳 ETAPA 2: Gerando QR Code...', createdInstance.id);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'generate_qr',
          instanceId: createdInstance.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.qrCode) {
        console.log('[Manual Creator] ✅ QR Code obtido com sucesso');
        
        // Verificar se já está em formato Base64
        let qrUrl = data.qrCode;
        if (!qrUrl.startsWith('data:image/')) {
          console.log('[Manual Creator] 🔄 QR Code não está em Base64, usando como string');
          // Para debug, vamos exibir mesmo assim
          qrUrl = `data:text/plain;charset=utf-8,${data.qrCode}`;
        }
        
        setQrCodeUrl(qrUrl);
        toast.success('QR Code gerado!', {
          description: 'Escaneie com WhatsApp'
        });
      } else if (data.waiting) {
        toast.info('QR Code ainda não disponível', {
          description: 'Aguarde alguns segundos'
        });
      } else {
        throw new Error(data.message || 'Falha ao gerar QR Code');
      }

    } catch (error: any) {
      console.error('[Manual Creator] ❌ Erro no QR Code:', error);
      toast.error('Erro ao gerar QR Code', {
        description: error.message
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const resetFlow = () => {
    setInstanceName('');
    setCreatedInstance(null);
    setQrCodeUrl(null);
    setDiscoveryResults(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-500" />
          Conectar WhatsApp (Sistema Manual - CORREÇÃO IMPLEMENTADA)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          ✅ Edge Function corrigida - GET /instance/{id}/qr
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Teste de VPS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">🔍 Teste de Conectividade VPS</h3>
            <Button
              onClick={runVPSDiscovery}
              disabled={isDiscovering}
              variant="outline"
              size="sm"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Testar VPS
                </>
              )}
            </Button>
          </div>

          {discoveryResults && (
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {discoveryResults.summary.workingEndpoints > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span className="font-medium">
                  {discoveryResults.summary.workingEndpoints}/{discoveryResults.summary.totalTests} endpoints funcionando
                </span>
              </div>
              
              {discoveryResults.recommendation && (
                <p className="text-sm text-blue-700">
                  ✅ VPS Online: {discoveryResults.recommendation.config}
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* ETAPA 1: Criar Instância */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">ETAPA 1</Badge>
            <h3 className="font-medium">Criar Instância WhatsApp</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: MinhaEmpresa_WhatsApp"
                disabled={isCreating || !!createdInstance}
              />
            </div>

            <Button
              onClick={createInstance}
              disabled={isCreating || !instanceName.trim() || !!createdInstance}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Instância...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Instância
                </>
              )}
            </Button>
          </div>

          {createdInstance && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700">Instância Criada!</span>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <p><strong>Nome:</strong> {createdInstance.instance_name}</p>
                <p><strong>VPS ID:</strong> {createdInstance.vps_instance_id}</p>
                <p><strong>Status:</strong> {createdInstance.connection_status}</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* ETAPA 2: Gerar QR Code */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50">ETAPA 2</Badge>
            <h3 className="font-medium">Gerar QR Code (CORRIGIDO)</h3>
          </div>

          <Button
            onClick={generateQR}
            disabled={isGeneratingQR || !createdInstance}
            className="w-full"
            variant={createdInstance ? "default" : "secondary"}
          >
            {isGeneratingQR ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando QR Code...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Gerar QR Code (GET Method)
              </>
            )}
          </Button>

          {qrCodeUrl && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                {qrCodeUrl.startsWith('data:image/') ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code WhatsApp" 
                    className="mx-auto max-w-full h-auto"
                    style={{ maxWidth: '300px' }}
                  />
                ) : (
                  <div className="p-4 bg-gray-100 rounded text-xs font-mono break-all">
                    <p className="text-orange-600 mb-2">⚠️ String QR (não Base64):</p>
                    {qrCodeUrl.substring(qrCodeUrl.indexOf(',') + 1, qrCodeUrl.indexOf(',') + 100)}...
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>✅ QR Code obtido da VPS!</p>
                {qrCodeUrl.startsWith('data:image/') ? (
                  <p>Escaneie com o WhatsApp do seu celular</p>
                ) : (
                  <p className="text-orange-600">VPS ainda não retorna Base64</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão Reset */}
        {(createdInstance || qrCodeUrl) && (
          <>
            <Separator />
            <Button onClick={resetFlow} variant="outline" className="w-full">
              Criar Nova Instância
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
