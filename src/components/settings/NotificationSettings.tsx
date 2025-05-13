
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

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    app: true,
    marketing: false,
    security: true,
    whatsapp: false
  });

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
          <Button variant="outline">Cancelar</Button>
          <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
            Salvar Preferências
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
