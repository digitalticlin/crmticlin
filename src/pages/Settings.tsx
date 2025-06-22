
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User } from "lucide-react";
import { OptimizedSettingsSection } from "@/components/settings/whatsapp/OptimizedSettingsSection";
import ProfileSettings from "@/components/settings/ProfileSettings";

export default function Settings() {
  return (
    <PageLayout>
      {/* Container principal com largura limitada a 1200px */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <ModernPageHeader 
          title="Configurações" 
          description="Gerencie as configurações da sua conta e preferências do sistema"
        />
        
        <Tabs defaultValue="whatsapp" className="w-full">
          {/* Menu de abas redimensionado para 1/3 da tela e centralizado */}
          <div className="flex justify-center mb-6">
            <TabsList className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-white/30">
              <TabsTrigger 
                value="whatsapp" 
                className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 flex-1"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 flex-1"
              >
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das abas */}
          <TabsContent value="whatsapp" className="space-y-6">
            <OptimizedSettingsSection />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
