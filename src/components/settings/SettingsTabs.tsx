
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { User, MessagesSquare, Users } from "lucide-react";
import ProfileSettings from "./ProfileSettings";
import WhatsAppSettings from "./WhatsAppSettings";
import TeamSettings from "./TeamSettings";

const SettingsTabs = () => {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="grid grid-cols-3 h-auto p-1 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-xl">
        <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <User className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Perfil</span>
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <MessagesSquare className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">WhatsApp</span>
        </TabsTrigger>
        <TabsTrigger value="team" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
          <Users className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Equipe</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <ProfileSettings />
      </TabsContent>
      
      <TabsContent value="whatsapp" className="space-y-4">
        <WhatsAppSettings />
      </TabsContent>

      <TabsContent value="team" className="space-y-4">
        <TeamSettings />
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
