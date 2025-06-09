
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  CreditCard, 
  Bug,
  Wrench,
  Activity,
  Shield,
  FileText,
  TestTube,
  Zap
} from "lucide-react";

const sidebarItems = [
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Métricas e análises do sistema",
    href: "/global-admin/analytics"
  },
  {
    id: "companies",
    label: "Empresas",
    icon: Building2,
    description: "Gerenciar empresas cadastradas",
    href: "/global-admin/companies"
  },
  {
    id: "users",
    label: "Usuários",
    icon: Users,
    description: "Gerenciar usuários do sistema",
    href: "/global-admin/users"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    description: "Instâncias e configurações WhatsApp",
    href: "/global-admin/whatsapp"
  },
  {
    id: "vps-diagnostics",
    label: "Diagnósticos VPS",
    icon: Wrench,
    description: "Ferramentas de diagnóstico e correção VPS",
    href: "/global-admin/vps-diagnostics"
  },
  {
    id: "plans",
    label: "Planos",
    icon: CreditCard,
    description: "Gerenciar planos e assinaturas",
    href: "/global-admin/plans"
  },
  {
    id: "system",
    label: "Sistema",
    icon: Activity,
    description: "Monitoramento e saúde do sistema",
    href: "/global-admin/system"
  },
  {
    id: "logs",
    label: "Logs",
    icon: FileText,
    description: "Logs de sistema e sincronização",
    href: "/global-admin/logs"
  },
  {
    id: "test",
    label: "Testes",
    icon: Bug,
    description: "Ferramentas de teste e diagnóstico",
    href: "/global-admin/test"
  },
  {
    id: "config",
    label: "Configurações",
    icon: Settings,
    description: "Configurações globais do sistema",
    href: "/global-admin/config"
  },
  {
    id: "whatsapp-test",
    label: "Testes WhatsApp",
    icon: TestTube,
    description: "Centro de testes WhatsApp completo",
    href: "/global-admin/whatsapp-test"
  },
  {
    id: "instances",
    label: "Instâncias",
    icon: Zap,
    description: "Gerenciamento de instâncias WhatsApp",
    href: "/global-admin/instances"
  }
];

export const GlobalAdminSidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    return location.pathname === href || 
           (href === "/global-admin/analytics" && location.pathname === "/global-admin");
  };

  return (
    <div className="w-64 bg-background border-r border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Admin Global</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Painel administrativo do sistema
        </p>
      </div>

      <nav className="p-2">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-left group ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs truncate ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
