
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { User, Bell, Sun, MessagesSquare } from "lucide-react";
import ProfileSettings from "./ProfileSettings";
import NotificationSettings from "./NotificationSettings";
import AppearanceSettings from "./AppearanceSettings";
import WhatsAppSettings from "./WhatsAppSettings";

const SettingsTabs = () => {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="grid grid-cols-4 h-auto p-1 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-xl">
        <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <User className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Perfil</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <Bell className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Notificações</span>
        </TabsTrigger>
        <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <Sun className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Aparência</span>
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <MessagesSquare className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">WhatsApp</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <ProfileSettings />
      </TabsContent>
      
      <TabsContent value="notifications" className="space-y-4">
        <NotificationSettings />
      </TabsContent>
      
      <TabsContent value="appearance" className="space-y-4">
        <AppearanceSettings />
      </TabsContent>
      
      <TabsContent value="whatsapp" className="space-y-4">
        <WhatsAppSettings />
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
