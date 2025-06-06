
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Building2, 
  CreditCard, 
  Settings, 
  BarChart3,
  Zap,
  Server
} from "lucide-react";

interface GlobalAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function GlobalAdminSidebar({ activeTab, setActiveTab }: GlobalAdminSidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Visão geral do sistema"
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
      description: "Gestão de instâncias"
    },
    {
      id: "whatsapp-test",
      label: "Teste WhatsApp",
      icon: Zap,
      description: "Diagnóstico e testes"
    },
    {
      id: "vps-test",
      label: "Diagnóstico VPS",
      icon: Server,
      description: "Análise de infraestrutura"
    },
    {
      id: "business",
      label: "Empresas",
      icon: Building2,
      description: "Gestão de empresas"
    },
    {
      id: "plans",
      label: "Planos",
      icon: CreditCard,
      description: "Planos e cobrança"
    },
    {
      id: "system",
      label: "Sistema",
      icon: Settings,
      description: "Configurações gerais"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Relatórios e métricas"
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Global Admin</h1>
            <p className="text-sm text-gray-500">Painel de controle</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  isActive 
                    ? "bg-blue-50 border border-blue-200 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <IconComponent className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isActive ? "text-blue-700" : "text-gray-900"
                  )}>
                    {item.label}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    isActive ? "text-blue-500" : "text-gray-500"
                  )}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
