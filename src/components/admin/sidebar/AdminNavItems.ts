
import { Building2, Users, CreditCard, MessageSquare, FileText, LifeBuoy, Settings, Globe } from "lucide-react";

export interface AdminNavItem {
  id: string;
  icon: typeof Building2; // LucideIcon type
  label: string;
  visible: boolean;
}

export const getAdminNavItems = (isSuperAdmin: boolean): AdminNavItem[] => {
  const adminNavItems = [
    {
      id: "companies",
      icon: Building2,
      label: "Empresas",
      visible: isSuperAdmin
    },
    {
      id: "users",
      icon: Users,
      label: "Usuários",
      visible: isSuperAdmin
    },
    {
      id: "plans",
      icon: CreditCard,
      label: "Planos",
      visible: isSuperAdmin
    },
    {
      id: "whatsapp",
      icon: MessageSquare,
      label: "WhatsApp",
      visible: isSuperAdmin
    },
    {
      id: "logs",
      icon: FileText,
      label: "Logs",
      visible: isSuperAdmin
    },
    {
      id: "support",
      icon: LifeBuoy,
      label: "Suporte",
      visible: isSuperAdmin
    },
    {
      id: "config",
      icon: Settings,
      label: "Configurações",
      visible: isSuperAdmin
    },
    {
      id: "deployment",
      icon: Globe,
      label: "Produção",
      visible: isSuperAdmin
    },
  ];
  
  return adminNavItems.filter(item => item.visible);
};
