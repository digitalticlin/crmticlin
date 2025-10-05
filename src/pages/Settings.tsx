
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Users } from "lucide-react";
import { OptimizedSettingsSection } from "@/components/settings/whatsapp/OptimizedSettingsSection";
import ProfileSettings from "@/components/settings/ProfileSettings";
import TeamSettings from "@/components/settings/TeamSettings";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { useUserPermissions } from "@/hooks/useUserPermissions";

export default function Settings() {
  const { permissions } = useUserPermissions();
  const isAdmin = permissions.role === 'admin';

  return (
    <div className="w-full">
      <ModernPageHeader 
        title="Configurações" 
        description="Gerencie as configurações da sua conta e preferências do sistema"
      />
        
      <Tabs defaultValue="profile" className="w-full">
        {/* Menu de abas mobile responsive */}
        <div className="flex justify-center mb-6">
          <TabsList className={`w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-white/30 text-xs sm:text-base ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} grid gap-1 sm:gap-0 p-1`}>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 px-2 sm:px-3"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">Perfil</span>
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 px-2 sm:px-3"
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">WhatsApp</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="team"
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 px-2 sm:px-3"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Equipe</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Conteúdo das abas com scroll natural */}
        <TabsContent value="profile" className="space-y-6 pb-8">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6 pb-8">
          <OptimizedSettingsSection />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="team" className="space-y-6 pb-8">
            <AdminGuard showDeniedMessage={false}>
              <TeamSettings />
            </AdminGuard>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
