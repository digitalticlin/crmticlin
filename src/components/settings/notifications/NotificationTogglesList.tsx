
import { useState } from "react";
import NotificationToggleItem from "./NotificationToggleItem";

interface NotificationsState {
  email: boolean;
  app: boolean;
  marketing: boolean;
  security: boolean;
  whatsapp: boolean;
}

interface NotificationTogglesListProps {
  notifications: NotificationsState;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationsState>>;
}

const NotificationTogglesList = ({ 
  notifications, 
  setNotifications 
}: NotificationTogglesListProps) => {
  const handleToggle = (key: keyof NotificationsState) => (checked: boolean) => {
    setNotifications({ ...notifications, [key]: checked });
  };

  return (
    <div className="space-y-4">
      <NotificationToggleItem
        title="Notificações por Email"
        description="Receba atualizações importantes por email"
        checked={notifications.email}
        onCheckedChange={handleToggle("email")}
      />
      
      <NotificationToggleItem
        title="Notificações no Aplicativo"
        description="Receba alertas dentro da plataforma Ticlin"
        checked={notifications.app}
        onCheckedChange={handleToggle("app")}
      />
      
      <NotificationToggleItem
        title="Alertas de Segurança"
        description="Receba alertas sobre atividades suspeitas ou login de novos dispositivos"
        checked={notifications.security}
        onCheckedChange={handleToggle("security")}
      />
      
      <NotificationToggleItem
        title="Mensagens de WhatsApp"
        description="Receba notificações de novas mensagens de WhatsApp"
        checked={notifications.whatsapp}
        onCheckedChange={handleToggle("whatsapp")}
      />
      
      <NotificationToggleItem
        title="Comunicações de Marketing"
        description="Receba dicas, atualizações de produto e ofertas especiais"
        checked={notifications.marketing}
        onCheckedChange={handleToggle("marketing")}
      />
    </div>
  );
};

export default NotificationTogglesList;
