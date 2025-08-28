
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Users } from "lucide-react";
import { OptimizedSettingsSection } from "@/components/settings/whatsapp/OptimizedSettingsSection";
import ProfileSettings from "@/components/settings/ProfileSettings";
import TeamSettings from "@/components/settings/TeamSettings";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function Settings() {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen w-full relative">
      {/* Fundo gradiente usando o componente reutilizável */}
      <BackgroundGradient className="fixed inset-0 z-0" />

      {/* Sidebar fixo */}
      <ResponsiveSidebar />
      
      {/* Container principal com z-index correto e centralização adequada */}
      <main className={cn(
        "min-h-screen z-30 transition-all duration-300",
        isMobile 
          ? "pt-14 w-full" 
          : isCollapsed 
            ? "ml-[64px] w-[calc(100vw-64px)]" 
            : "ml-[200px] w-[calc(100vw-200px)]"
      )}>
        {/* Container centralizado com scroll */}
        <div className="w-full h-screen overflow-y-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "py-6 lg:py-8 space-y-6 lg:space-y-8 mx-auto max-w-[1400px]",
            isMobile && "pt-6"
          )}>
            <ModernPageHeader 
              title="Configurações" 
              description="Gerencie as configurações da sua conta e preferências do sistema"
            />
              
            <Tabs defaultValue="profile" className="w-full">
              {/* Menu de abas reordenado: Perfil, WhatsApp, Equipe */}
              <div className="flex justify-center mb-6">
                <TabsList className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-white/30 grid grid-cols-3 text-sm sm:text-base">
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
              <TabsContent value="profile" className="space-y-6 pb-8">
                <ProfileSettings />
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-6 pb-8">
                <OptimizedSettingsSection />
              </TabsContent>

              <TabsContent value="team" className="space-y-6 pb-8">
                <TeamSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
