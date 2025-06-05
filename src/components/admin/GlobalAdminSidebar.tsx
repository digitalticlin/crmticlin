
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  MessageSquare, 
  Building2, 
  CreditCard, 
  Settings2,
  BarChart3
} from "lucide-react";

interface GlobalAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Visão geral do sistema" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, description: "Instâncias e conexões" },
  { id: "business", label: "Empresas & Usuários", icon: Building2, description: "Gestão de clientes" },
  { id: "plans", label: "Planos & Cobrança", icon: CreditCard, description: "Assinaturas e billing" },
  { id: "system", label: "Sistema", icon: Settings2, description: "Logs e configurações" },
  { id: "analytics", label: "Relatórios", icon: BarChart3, description: "Métricas e análises" },
];

export default function GlobalAdminSidebar({ activeTab, setActiveTab }: GlobalAdminSidebarProps) {
  return (
    <div className="w-72 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin Global</h2>
            <p className="text-sm text-slate-500">Painel de controle</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-4 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-white shadow-sm border border-slate-200 text-blue-600" 
                  : "hover:bg-white/50 text-slate-600 hover:text-slate-800"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-slate-100 text-slate-500"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Sistema Online</span>
          </div>
          <p className="text-xs text-green-600">
            Todos os serviços funcionando normalmente
          </p>
        </div>
      </div>
    </div>
  );
}
