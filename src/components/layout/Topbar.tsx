
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useSwitchCompany } from "@/hooks/useSwitchCompany";
import TopbarUserMenu from "./TopbarUserMenu";
import { Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

// Novo Topbar com visual cinza translúcido, título e botões
const Topbar = () => {
  const { user } = useAuth();
  const { fullName, avatarUrl } = useProfileData();
  const { companyId, companyName } = useCompanyData();

  const { companies } = useUserCompanies(user?.id);
  const { switchCompany } = useSwitchCompany(user?.id);

  // Pega o email do usuário autenticado
  const email = user?.email || "";

  // Tema
  const { theme, setTheme } = useTheme();

  // Título da página, pode ser dinâmico em rotas com React Router (opcional)
  const pageTitle = "Dashboard";

  return (
    <div className="sticky top-0 w-full h-16 flex items-center justify-between px-6 bg-gray-50/95 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 z-40">
      {/* Título à esquerda */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
      </div>

      {/* Botões e menu do usuário à direita */}
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
};

export default Topbar;

