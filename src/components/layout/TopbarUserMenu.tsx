
import React, { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Função para pegar as iniciais (primeiras duas letras do nome)
function getInitials(name?: string | null) {
  if (!name) return "U";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

interface CompanyOption {
  id: string;
  name: string;
}

interface TopbarUserMenuProps {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  companyId?: string | null;
  companies?: CompanyOption[];
  onSwitchCompany?: (companyId: string) => void;
}

const TopbarUserMenu: React.FC<Partial<TopbarUserMenuProps>> = ({
  fullName,
  email,
  avatarUrl,
  companyId,
  companies = [],
  onSwitchCompany
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const currentCompanyName = useMemo(
    () => companies?.find(c => c.id === companyId)?.name ?? "",
    [companies, companyId]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Abrir menu do usuário"
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Avatar className="h-9 w-9">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={fullName} />
            ) : (
              <AvatarFallback className="bg-ticlin/20 text-black text-lg font-semibold">
                {getInitials(fullName)}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-50 bg-white dark:bg-gray-900 rounded-md shadow-lg">
        <DropdownMenuLabel>
          <div className="font-bold">{fullName || "Usuário"}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
          {currentCompanyName && (
            <div className="text-xs text-muted-foreground mt-1">Empresa: {currentCompanyName}</div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          Editar perfil
        </DropdownMenuItem>
        {companies.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Trocar de conta</DropdownMenuLabel>
            {companies.map((company) =>
              company.id !== companyId && (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => {
                    onSwitchCompany?.(company.id);
                    toast.success(`Alternado para empresa: ${company.name}`);
                  }}
                >
                  {company.name}
                </DropdownMenuItem>
              )
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TopbarUserMenu;
