
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import QrCodeDialog from "./QrCodeDialog";
import { createWhatsAppInstance } from "@/services/whatsapp/instanceCreationService";
import { supabase } from "@/integrations/supabase/client";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean; // Indicates if user is SuperAdmin with no plan restrictions
  userEmail: string; // User email to use as base for instance name
}

const PlaceholderInstanceCard = ({ 
  isSuperAdmin = false,
  userEmail
}: PlaceholderInstanceCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Extract username from email when component mounts
  useEffect(() => {
    if (userEmail) {
      // Extract username from email (part before @)
      const extractedUsername = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, '');
      setUsername(extractedUsername);
      
      // Verificar se o usuário é novo (criou conta recentemente)
      const checkIfNewUser = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const { data, error } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Erro ao verificar perfil do usuário:", error);
            return;
          }
          
          if (data) {
            // Verificar se a conta foi criada nas últimas 24 horas
            const creationDate = new Date(data.created_at);
            const now = new Date();
            const hoursElapsed = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
            setIsNewUser(hoursElapsed < 24);
          }
        } catch (error) {
          console.error("Erro ao verificar status do usuário:", error);
        }
      };
      
      checkIfNewUser();
    }
  }, [userEmail]);

  const handleAddWhatsApp = async () => {
    if (isCreating) {
      console.log("Already processing an add request, ignoring");
      return;
    }
    
    if (!username) {
      toast.error("Could not get your username");
      return;
    }
    
    // Permitir conexão se for SuperAdmin ou usuário novo (primeira conexão)
    if (!isSuperAdmin && !isNewUser) {
      toast.error("Disponível apenas em planos superiores. Atualize seu plano para adicionar mais números de WhatsApp.");
      return;
    }

    try {
      setIsCreating(true);
      
      const result = await createWhatsAppInstance(username);
      
      if (result.success && result.qrCode) {
        // Display QR code to user
        setQrCodeUrl(result.qrCode);
        setIsDialogOpen(true);
        toast.success("Solicitação de conexão enviada com sucesso!");
      } else {
        toast.error(result.error || "Não foi possível criar a instância do WhatsApp");
      }
      
    } catch (error: any) {
      console.error("Error in handleAddWhatsApp:", error);
      toast.error("Não foi possível criar a instância do WhatsApp");
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
          
          {!isSuperAdmin && !isNewUser ? (
            <p className="text-sm text-muted-foreground">
              Disponível em planos superiores. Atualize seu plano para adicionar mais números de WhatsApp.
            </p>
          ) : isNewUser ? (
            <p className="text-sm text-muted-foreground">
              Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
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
            disabled={(!isSuperAdmin && !isNewUser) || isCreating}
            onClick={handleAddWhatsApp}
          >
            {isCreating ? "Conectando..." : (isSuperAdmin || isNewUser) ? "Adicionar WhatsApp" : "Atualizar plano"}
          </Button>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <QrCodeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        qrCodeUrl={qrCodeUrl}
      />
    </>
  );
};

export default PlaceholderInstanceCard;
