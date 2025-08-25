
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Users } from "lucide-react";
import { OptimizedSettingsSection } from "@/components/settings/whatsapp/OptimizedSettingsSection";
import ProfileSettings from "@/components/settings/ProfileSettings";
import TeamSettings from "@/components/settings/TeamSettings";

export default function Settings() {
  return (
    <PageLayout>
      <ModernPageHeader 
        title="Configurações" 
        description="Gerencie as configurações da sua conta e preferências do sistema"
      />
        
        <Tabs defaultValue="profile" className="w-full">
          {/* Menu de abas reordenado: Perfil, WhatsApp, Equipe */}
          <div className="flex justify-center mb-6">
            <TabsList className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-white/30 grid grid-cols-3">
              <TabsTrigger 
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
              >
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger 
                value="whatsapp" 
                className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger 
                value="team"
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <Users className="h-4 w-4" />
                Equipe
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das abas com scroll natural */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <OptimizedSettingsSection />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamSettings />
          </TabsContent>
        </Tabs>
    </PageLayout>
  );
}
