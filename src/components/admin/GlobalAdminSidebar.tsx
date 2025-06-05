
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  FileText, 
  HelpCircle,
  Activity,
  Database,
  Server,
  Sync
} from "lucide-react";

interface GlobalAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const sidebarItems = [
  { id: "companies", label: "Empresas", icon: Building },
  { id: "users", label: "Usuários", icon: Users },
  { id: "plans", label: "Planos", icon: CreditCard },
  { id: "whatsapp", label: "WhatsApp & Instâncias", icon: MessageSquare },
  { id: "diagnostic", label: "Diagnóstico", icon: Activity },
  { id: "persistence", label: "Persistência", icon: Database },
  { id: "sync", label: "Sincronização", icon: Sync },
  { id: "sync-logs", label: "Logs Sync", icon: FileText },
  { id: "vps", label: "VPS", icon: Server },
  { id: "logs", label: "Logs", icon: FileText },
];

export default function GlobalAdminSidebar({ activeTab, setActiveTab }: GlobalAdminSidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800">Admin Global</h2>
        <p className="text-sm text-gray-500">Painel de controle</p>
      </div>
      
      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === item.id && "bg-blue-600 text-white hover:bg-blue-700"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
