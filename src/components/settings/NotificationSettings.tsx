
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import NotificationTogglesList from "./notifications/NotificationTogglesList";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    app: true,
    marketing: false,
    security: true,
    whatsapp: false,
    whatsapp_instant: false,
    whatsapp_digest: false
  });

  const handleSave = async () => {
    try {
      // Aqui seria a chamada para salvar as configurações no Supabase
      // const { error } = await supabase
      //   .from('user_settings')
      //   .upsert({ user_id: 'current-user-id', notifications: notifications });
      
      // if (error) throw error;
      
      toast.success("Preferências de notificação salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      toast.error("Não foi possível salvar as preferências");
    }
  };

  const handleCancel = () => {
    // Recarregar as configurações originais
    toast.info("Alterações descartadas");
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Configure como e quando você deseja receber atualizações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preferências de Notificação</h3>
          
          <NotificationTogglesList 
            notifications={notifications} 
            setNotifications={setNotifications} 
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button 
            className="bg-ticlin hover:bg-ticlin/90 text-black"
            onClick={handleSave}
          >
            Salvar Preferências
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
