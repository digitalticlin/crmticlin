
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import QrCodeDialog from "./QrCodeDialog";
import { createWhatsAppInstance } from "@/services/whatsapp/instanceCreationService";

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
  
  // Extract username from email when component mounts
  useEffect(() => {
    if (userEmail) {
      // Extract username from email (part before @)
      const extractedUsername = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, '');
      setUsername(extractedUsername);
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
    
    if (!isSuperAdmin) {
      toast.error("Available only in higher plans. Upgrade your plan.");
      return;
    }

    try {
      setIsCreating(true);
      
      const result = await createWhatsAppInstance(username);
      
      if (result.success && result.qrCode) {
        // Display QR code to user
        setQrCodeUrl(result.qrCode);
        setIsDialogOpen(true);
        toast.success("Connection request sent successfully!");
      } else {
        toast.error(result.error || "Could not create WhatsApp instance");
      }
      
    } catch (error: any) {
      console.error("Error in handleAddWhatsApp:", error);
      toast.error("Could not create WhatsApp instance");
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
