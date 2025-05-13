
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { evolutionApiService } from "@/services/evolution-api";
import { WhatsAppStatus } from "@/hooks/whatsapp/database";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean; // Indica se o usuário é SuperAdmin e não tem restrições de plano
  userEmail: string; // Email do usuário para usar como base do nome da instância
}

const PlaceholderInstanceCard = ({ 
  isSuperAdmin = false,
  userEmail  // Receive userEmail as a prop
}: PlaceholderInstanceCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Extrair nome de usuário do email quando o componente montar
  useEffect(() => {
    if (userEmail) {
      // Extrai o nome de usuário do email (parte antes do @)
      const extractedUsername = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, '');
      setUsername(extractedUsername);
    }
  }, [userEmail]);

  // Função para gerar um nome único com sequencial numérico
  const generateUniqueInstanceName = async (baseUsername: string): Promise<string> => {
    try {
      // Buscar instâncias existentes no banco
      const { data: existingInstances, error } = await supabase
        .from('whatsapp_numbers')
        .select('instance_name')
        .filter('instance_name', 'ilike', `${baseUsername}%`);

      if (error) {
        console.error("Erro ao verificar nomes existentes:", error);
        return `${baseUsername}1`; // Fallback
      }

      if (!existingInstances || existingInstances.length === 0) {
        return baseUsername; // Usar o nome base se não houver instâncias
      }

      // Encontrar o maior número sequencial
      let highestSeq = 0;
      existingInstances.forEach(instance => {
        const name = instance.instance_name.toLowerCase();
        if (name === baseUsername.toLowerCase()) {
          highestSeq = Math.max(highestSeq, 1);
        } else {
          const regex = new RegExp(`^${baseUsername.toLowerCase()}(\\d+)$`);
          const match = name.match(regex);
          if (match && match[1]) {
            const seq = parseInt(match[1], 10);
            highestSeq = Math.max(highestSeq, seq + 1);
          }
        }
      });

      return highestSeq > 0 ? `${baseUsername}${highestSeq}` : baseUsername;
    } catch (error) {
      console.error("Erro ao gerar nome único:", error);
      return `${baseUsername}1`; // Fallback em caso de erro
    }
  };

  const handleAddWhatsApp = async () => {
    if (isCreating) {
      console.log("Já processando uma solicitação de adição, ignorando");
      return;
    }
    
    if (!username) {
      toast.error("Não foi possível obter seu nome de usuário");
      return;
    }
    
    if (!isSuperAdmin) {
      toast.error("Disponível apenas em planos superiores. Atualize seu plano.");
      return;
    }

    try {
      setIsCreating(true);
      
      // Gerar nome de instância único
      const uniqueInstanceName = await generateUniqueInstanceName(username);
      console.log("Nome de instância único gerado:", uniqueInstanceName);
      
      // Obter o ID da empresa do usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error("Erro ao obter dados do usuário");
      }
      
      const userId = userData.user?.id;
      console.log("ID do usuário atual:", userId);
      
      // Obter o company_id do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (profileError || !profileData?.company_id) {
        throw new Error("Erro ao obter a empresa do usuário");
      }
      
      const companyId = profileData.company_id;
      console.log("ID da empresa:", companyId);
      
      // Configurar o corpo da requisição para a Evolution API
      const requestBody = {
        instanceName: uniqueInstanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };
      
      console.log("Enviando requisição para a Evolution API:", requestBody);
      
      // Fazer a requisição diretamente para a Evolution API
      const response = await evolutionApiService.createInstance(uniqueInstanceName);
      
      if (!response || !response.qrcode || !response.qrcode.base64) {
        throw new Error("QR code não recebido da API");
      }
      
      // Extrair o QR code da resposta
      const qrCode = response.qrcode.base64;
      console.log("QR code recebido (primeiros 50 caracteres):", qrCode.substring(0, 50));
      
      // Salvar a instância no banco de dados
      // Corrigindo os erros de tipo aqui
      const whatsappData = {
        instance_name: uniqueInstanceName,
        phone: "", // Será atualizado quando conectado
        company_id: companyId,
        status: "connecting" as WhatsAppStatus, // Especificando o tipo correto
        qr_code: qrCode,
        instance_id: response.instanceId, // Corrigido de response.instance.instanceId
        evolution_instance_name: response.instanceName, // Corrigido de response.instance.instanceName
        evolution_token: response.hash || ""
      };
      
      // Inserir no banco de dados
      const { error: dbError } = await supabase
        .from('whatsapp_numbers')
        .insert(whatsappData);
    
      if (dbError) {
        console.error("Erro ao salvar instância no banco de dados:", dbError);
        throw new Error("Erro ao salvar a instância");
      }
      
      // Exibir o QR code para o usuário
      setQrCodeUrl(qrCode);
      setIsDialogOpen(true);
      toast.success("Solicitação de conexão enviada com sucesso!");
      
    } catch (error: any) {
      console.error("Erro completo ao criar instância:", error);
      toast.error("Não foi possível criar a instância de WhatsApp");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden glass-card border-0 flex flex-col items-center justify-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent">
        <CardContent className="p-0 flex flex-col items-center text-center space-y-2">
          <div className="mb-2">
            <MessageSquare className="h-12 w-12 text-green-500" />
          </div>
          
          <h3 className="font-medium">Adicionar número</h3>
          
          {!isSuperAdmin ? (
            <p className="text-sm text-muted-foreground">
              Disponível em planos superiores. Atualize seu plano para adicionar mais números de WhatsApp.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Como SuperAdmin, você pode adicionar quantos números quiser.
            </p>
          )}
          
          <Button 
            variant="whatsapp"
            size="sm"
            className="mt-2"
            disabled={!isSuperAdmin || isCreating}
            onClick={handleAddWhatsApp}
          >
            {isCreating ? "Conectando..." : isSuperAdmin ? "Adicionar WhatsApp" : "Atualizar plano"}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog para exibir QR Code */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conecte seu WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie este código QR com seu WhatsApp para conectar sua conta.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {qrCodeUrl ? (
              <>
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-full max-w-[250px] h-auto mb-4"
                />
                <p className="text-sm text-center text-muted-foreground">
                  Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p>QR Code não disponível. Tente novamente.</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceholderInstanceCard;
