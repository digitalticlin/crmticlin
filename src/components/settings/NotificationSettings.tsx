
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba atualizações importantes por email
                </p>
              </div>
              <Switch 
                checked={notifications.email} 
                onCheckedChange={(checked) => setNotifications({...notifications, email: checked})} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações no Aplicativo</Label>
                <p className="text-sm text-muted-foreground">
                  Receba alertas dentro da plataforma Ticlin
                </p>
              </div>
              <Switch 
                checked={notifications.app} 
                onCheckedChange={(checked) => setNotifications({...notifications, app: checked})} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Segurança</Label>
                <p className="text-sm text-muted-foreground">
                  Receba alertas sobre atividades suspeitas ou login de novos dispositivos
                </p>
              </div>
              <Switch 
                checked={notifications.security} 
                onCheckedChange={(checked) => setNotifications({...notifications, security: checked})} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mensagens de WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações de novas mensagens de WhatsApp
                </p>
              </div>
              <Switch 
                checked={notifications.whatsapp} 
                onCheckedChange={(checked) => setNotifications({...notifications, whatsapp: checked})} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comunicações de Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Receba dicas, atualizações de produto e ofertas especiais
                </p>
              </div>
              <Switch 
                checked={notifications.marketing} 
                onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})} 
              />
            </div>
          </div>
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
