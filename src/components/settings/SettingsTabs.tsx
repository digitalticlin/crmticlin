
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Bell, Sparkles, User, Building } from "lucide-react";
import { OptimizedSettingsSection } from "./whatsapp/OptimizedSettingsSection";
import NotificationSettings from "./NotificationSettings";
import AISettings from "./AISettings";
import ProfileSettings from "./ProfileSettings";
import CompanySettings from "./CompanySettings";

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState("whatsapp");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
  );
};

export default SettingsTabs;
