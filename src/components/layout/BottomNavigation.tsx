import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Settings,
  Kanban,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface NavItem {
  icon: any;
  label: string;
  href: string;
  requiredPermission: string | null;
}

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useUserPermissions();
  const [scrollPosition, setScrollPosition] = useState(0);

  const allNavItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
      requiredPermission: null,
    },
    {
      icon: Kanban,
      label: "Funil",
      href: "/sales-funnel",
      requiredPermission: null,
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/whatsapp-chat",
      requiredPermission: null,
    },
    {
      icon: Users,
      label: "Clientes",
      href: "/clients",
      requiredPermission: null,
    },
    {
      icon: Bot,
      label: "Agentes IA",
      href: "/ai-agents",
      requiredPermission: "canManageFunnels",
    },
    {
      icon: CreditCard,
      label: "Planos",
      href: "/plans",
      requiredPermission: null,
    },
    {
      icon: Settings,
      label: "Config",
      href: "/settings",
      requiredPermission: "canAccessSettings",
    },
  ];

  // Filtrar itens baseado nas permissões
  const navItems = allNavItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return permissions[item.requiredPermission as keyof typeof permissions];
  });

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" && location.pathname === "/") return true;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < navItems.length - 4;

  const scroll = (direction: "left" | "right") => {
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - 1)
        : Math.min(navItems.length - 4, scrollPosition + 1);
    setScrollPosition(newPosition);
  };

  // Se tiver 4 itens ou menos, não precisa de carrossel
  const showCarousel = navItems.length > 4;
  const visibleItems = showCarousel
    ? navItems.slice(scrollPosition, scrollPosition + 4)
    : navItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-white/30 shadow-2xl">
      <div className="relative h-16 flex items-center justify-between px-2">
        {/* Botão de navegação esquerda */}
        {showCarousel && (
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "absolute left-0 z-10 w-8 h-full flex items-center justify-center bg-gradient-to-r from-white/95 to-transparent",
              !canScrollLeft && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Itens de navegação */}
        <div
          className={cn(
            "flex items-center justify-around flex-1 transition-all duration-300",
            showCarousel && "px-8"
          )}
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  "min-w-[70px] max-w-[80px]",
                  active
                    ? "text-yellow-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    active && "scale-110"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium truncate w-full text-center",
                    active && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-yellow-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Botão de navegação direita */}
        {showCarousel && (
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "absolute right-0 z-10 w-8 h-full flex items-center justify-center bg-gradient-to-l from-white/95 to-transparent",
              !canScrollRight && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Indicador de posição do carrossel */}
      {showCarousel && (
        <div className="absolute bottom-0 left-0 right-0 h-1 flex gap-1 justify-center pb-1">
          {Array.from({ length: Math.ceil(navItems.length / 4) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-0.5 rounded-full transition-all duration-300",
                Math.floor(scrollPosition / 4) === i
                  ? "bg-yellow-500"
                  : "bg-gray-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
