
import { cn } from "@/lib/utils";
import { 
  Zap
} from "lucide-react";

interface GlobalAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function GlobalAdminSidebar({ activeTab, setActiveTab }: GlobalAdminSidebarProps) {
  const menuItems = [
    {
      id: "whatsapp-test",
      label: "Teste WhatsApp",
      icon: Zap,
      description: "Centro de testes completo"
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Centro de Testes</h1>
            <p className="text-sm text-gray-500">Validação WhatsApp</p>
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
                    ? "bg-green-50 border border-green-200 text-green-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <IconComponent className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-green-600" : "text-gray-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isActive ? "text-green-700" : "text-gray-900"
                  )}>
                    {item.label}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    isActive ? "text-green-500" : "text-gray-500"
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
