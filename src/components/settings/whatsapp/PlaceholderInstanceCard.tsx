
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useWhatsAppInstances } from "@/hooks/whatsapp/useWhatsAppInstanceCore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const isAddingRef = useRef(false);
  
  // Hook para gerenciar instâncias de WhatsApp - Pass the userEmail
  const { addNewInstance } = useWhatsAppInstances(userEmail);

  // Extrair nome de usuário do email quando o componente montar
  useEffect(() => {
    if (userEmail) {
      // Extrai o nome de usuário do email (parte antes do @)
      const extractedUsername = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, '');
      setUsername(extractedUsername);
      console.log("Nome de usuário extraído:", extractedUsername);
    }
  }, [userEmail]);

  const handleAddWhatsApp = async () => {
    // Prevent double clicks or multiple submissions
    if (isAddingRef.current) {
      console.log("Já processando uma solicitação de adição, ignorando");
      return;
    }
    
    if (!username) {
      toast.error("Não foi possível obter seu nome de usuário");
      return;
    }

    try {
      isAddingRef.current = true;
      setIsCreating(true);
      console.log("Iniciando conexão de nova instância WhatsApp com username:", username);
      
      // Add extra logging to trace the execution flow
      console.log("Chamando addNewInstance com username:", username);
      
      // Conectar WhatsApp usando o username como nome da instância
      const result = await addNewInstance(username);
      console.log("Resultado da adição de nova instância:", result);
      
      // Se houver um QR Code retornado, exibir para o usuário
      if (result?.qrCodeUrl) {
        console.log("QR code recebido (primeiros 50 caracteres):", 
          result.qrCodeUrl.substring(0, 50));
        setQrCodeUrl(result.qrCodeUrl);
        setIsDialogOpen(true);
        toast.success("WhatsApp conectado com sucesso!");
      } else {
        console.log("Nenhum QR code retornado do addNewInstance");
        toast.error("QR code não recebido. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro completo ao criar instância:", error);
      toast.error("Não foi possível criar a instância de WhatsApp");
    } finally {
      setIsCreating(false);
      // Reset the ref after a small delay to prevent accidental double-clicking
      setTimeout(() => {
        isAddingRef.current = false;
      }, 1000);
    }
  };

  const handleOpenDialog = () => {
    if (!isSuperAdmin) {
      toast.error("Disponível apenas em planos superiores. Atualize seu plano.");
      return;
    }
    
    // Log the current state before attempting to create an instance
    console.log("Status antes de criar instância:", { 
      isSuperAdmin, 
      userEmail,
      username,
      isCreating: isCreating,
      isAddingRef: isAddingRef.current 
    });
    
    // Iniciar processo de conexão diretamente
    handleAddWhatsApp();
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
            disabled={!isSuperAdmin || isCreating || isAddingRef.current}
            onClick={handleOpenDialog}
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
