
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import TopbarUserMenu from "@/components/layout/TopbarUserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useState } from "react";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import LazyCustomizer from "@/components/dashboard/lazy/LazyCustomizer";

interface DashboardHeaderProps {}

export default function DashboardHeader({}: DashboardHeaderProps) {
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  });

  // Dados do usuário para o menu/avatar
  const { user } = useAuth();
  const { fullName, avatarUrl } = useProfileData();
  const { companyId } = useCompanyData();
  const email = user?.email || "";

  // Função vazia para compatibilidade
  const switchCompany = () => {
    console.log('switchCompany called');
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 mb-6 md:mb-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-4 sm:p-6 shadow-lg">
      {/* Linha superior: Saudação e Menu do usuário */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{greeting}</h1>
          <p className="text-sm sm:text-base text-gray-800 font-medium hidden sm:block">
            Bem-vindo de volta ao seu dashboard
          </p>
          {/* Versão mobile mais curta */}
          <p className="text-sm text-gray-800 font-medium sm:hidden">
            Seu dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
          {/* Botão de notificações */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="hover:bg-white/20 rounded-xl backdrop-blur-sm h-10 w-10 sm:h-auto sm:w-auto"
          >
            <Bell className="w-5 h-5" />
          </Button>

          {/* Avatar/Menu do usuário */}
          <TopbarUserMenu
            fullName={fullName}
            email={email}
            avatarUrl={avatarUrl}
            companyId={companyId}
            companies={[]} // Lista vazia para compatibilidade
            onSwitchCompany={switchCompany}
          />
        </div>
      </div>

      {/* Linha inferior: Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
        <div className="flex-1 sm:flex-initial">
          <PeriodFilter />
        </div>
        <div className="flex-1 sm:flex-initial">
          <LazyCustomizer />
        </div>
      </div>
    </div>
  );
}
