
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Bell, Sparkles, User, Building } from "lucide-react";
import { OptimizedSettingsSection } from "@/components/settings/whatsapp/OptimizedSettingsSection";
import { VPSStatusIndicator } from "@/components/settings/whatsapp/VPSStatusIndicator";
import NotificationSettings from "@/components/settings/NotificationSettings";
import AISettings from "@/components/settings/AISettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import CompanySettings from "@/components/settings/CompanySettings";

export default function Settings() {
  return (
    <PageLayout>
      <ModernPageHeader 
        title="Configurações" 
        description="Gerencie as configurações da sua conta e preferências do sistema"
        action={<VPSStatusIndicator />}
      />
      
      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-white/30">
          <TabsTrigger 
            value="whatsapp" 
            className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger 
            value="ai"
            className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Sparkles className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger 
            value="profile"
            className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
          >
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger 
            value="company"
            className="flex items-center gap-2 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
          >
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="whatsapp" className="space-y-6">
            <OptimizedSettingsSection />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="ai">
            <AISettings />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="company">
            <CompanySettings />
          </TabsContent>
        </div>
      </Tabs>
    </PageLayout>
  );
}
