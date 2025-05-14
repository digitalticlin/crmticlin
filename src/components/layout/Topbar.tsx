
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useSwitchCompany } from "@/hooks/useSwitchCompany";
import TopbarUserMenu from "./TopbarUserMenu";

// Exemplo simples do Topbar (adapte para seu layout real)
const Topbar = () => {
  const { user } = useAuth();
  const {
    fullName,
    avatarUrl,
  } = useProfileData();
  const {
    companyId,
    companyName,
  } = useCompanyData();

  const { companies } = useUserCompanies(user?.id);
  const { switchCompany } = useSwitchCompany(user?.id);

  // Pega o email do usuário autenticado
  const email = user?.email || "";

  return (
    <div className="sticky top-0 w-full h-16 flex items-center justify-end px-4 bg-white border-b z-40">
      <TopbarUserMenu
        fullName={fullName}
        email={email}
        avatarUrl={avatarUrl}
        companyId={companyId}
        companies={companies}
        onSwitchCompany={switchCompany}
      />
    </div>
  );
};

export default Topbar;
