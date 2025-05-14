
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell } from "lucide-react";
import TopbarUserMenu from "@/components/layout/TopbarUserMenu";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useSwitchCompany } from "@/hooks/useSwitchCompany";
import { useState } from "react";

interface DashboardHeaderProps {}

export default function DashboardHeader({}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
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
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold">{greeting}, Admin</h1>
        <p className="text-muted-foreground">Bem-vindo de volta ao seu dashboard</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Botão de tema */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Trocar tema"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Botão de notificações */}
        <Button variant="ghost" size="icon" aria-label="Notificações">
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
