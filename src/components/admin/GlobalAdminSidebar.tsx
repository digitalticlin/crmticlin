
import React from "react";
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
  Zap
} from "lucide-react";

const sidebarItems = [
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Métricas e análises do sistema"
  },
  {
    id: "companies",
    label: "Empresas",
    icon: Building2,
    description: "Gerenciar empresas cadastradas"
  },
  {
    id: "users",
    label: "Usuários",
    icon: Users,
    description: "Gerenciar usuários do sistema"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    description: "Instâncias e configurações WhatsApp"
  },
  {
    id: "vps-diagnostics",
    label: "Diagnósticos VPS",
    icon: Wrench,
    description: "Ferramentas de diagnóstico e correção VPS"
  },
  {
    id: "plans",
    label: "Planos",
    icon: CreditCard,
    description: "Gerenciar planos e assinaturas"
  },
  {
    id: "system",
    label: "Sistema",
    icon: Activity,
    description: "Monitoramento e saúde do sistema"
  },
  {
    id: "logs",
    label: "Logs",
    icon: FileText,
    description: "Logs de sistema e sincronização"
  },
  {
    id: "test",
    label: "Testes",
    icon: Bug,
    description: "Ferramentas de teste e diagnóstico"
  },
  {
    id: "config",
    label: "Configurações",
    icon: Settings,
    description: "Configurações globais do sistema"
  }
];

interface GlobalAdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const GlobalAdminSidebar: React.FC<GlobalAdminSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
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
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-left group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs truncate ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
