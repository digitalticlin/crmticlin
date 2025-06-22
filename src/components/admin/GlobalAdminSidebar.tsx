
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Database,
  Home
} from "lucide-react";

const navigationItems = [
  {
    name: "Instâncias",
    href: "/global-admin/instances",
    icon: Database,
    description: "Gerenciar instâncias WhatsApp"
  }
];

export const GlobalAdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2 text-gray-900 hover:text-blue-600">
          <Home className="h-5 w-5" />
          <span className="text-sm font-medium">← Voltar ao App</span>
        </Link>
      </div>
      
      <div className="flex-1 px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Administração Global
          </h2>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-blue-500" : "text-gray-400"
                )} />
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
