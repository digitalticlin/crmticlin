
import NotificationToggleItem from "./NotificationToggleItem";

interface NotificationsState {
  email: boolean;
  app: boolean;
  marketing: boolean;
  security: boolean;
  whatsapp: boolean;
  whatsapp_instant?: boolean;
  whatsapp_digest?: boolean;
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
    setNotifications(prev => {
      // Caso especial para o toggle principal do WhatsApp
      if (key === 'whatsapp') {
        return {
          ...prev,
          [key]: checked,
          // Se desativar WhatsApp, desativa todas as opções relacionadas
          ...(checked ? {} : { whatsapp_instant: false, whatsapp_digest: false })
        };
      }
      
      return { ...prev, [key]: checked };
    });
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
      
      {/* Sub-opções de WhatsApp - visíveis apenas quando WhatsApp está ativado */}
      {notifications.whatsapp && (
        <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
          <NotificationToggleItem
            title="Notificações instantâneas"
            description="Receba notificações imediatas para cada nova mensagem"
            checked={notifications.whatsapp_instant || false}
            onCheckedChange={handleToggle("whatsapp_instant")}
          />
          
          <NotificationToggleItem
            title="Resumo diário"
            description="Receba um resumo diário de todas as conversas"
            checked={notifications.whatsapp_digest || false}
            onCheckedChange={handleToggle("whatsapp_digest")}
          />
        </div>
      )}
      
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
