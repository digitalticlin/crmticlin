
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import TopbarUserMenu from "@/components/layout/TopbarUserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useSwitchCompany } from "@/hooks/useSwitchCompany";
import { useState, memo } from "react";

interface DashboardHeaderProps {}

function DashboardHeader({}: DashboardHeaderProps) {
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
  const { companies } = useUserCompanies(user?.id);
  const { switchCompany } = useSwitchCompany(user?.id);
  const email = user?.email || "";

  return (
    <div className="flex justify-between items-center mb-8 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/30 p-6 shadow-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, Admin</h1>
        <p className="text-gray-800 font-medium">Bem-vindo de volta ao seu dashboard</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Botão de notificações */}
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Notificações"
          className="hover:bg-white/20 rounded-xl backdrop-blur-sm"
        >
          <Bell className="w-5 h-5" />
        </Button>

        {/* Avatar/Menu do usuário */}
        <TopbarUserMenu
          fullName={fullName}
          email={email}
          avatarUrl={avatarUrl}
          companyId={companyId}
          companies={companies}
          onSwitchCompany={switchCompany}
        />
      </div>
    </div>
  );
}

export default memo(DashboardHeader);
