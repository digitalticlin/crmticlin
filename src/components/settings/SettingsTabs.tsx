
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SettingsTabs = () => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className={cn(
        "grid h-auto p-1 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-xl",
        isMobile ? "grid-cols-1 w-full gap-1" : "grid-cols-3"
      )}>
        <TabsTrigger 
          value="profile" 
          className={cn(
            "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg",
            isMobile ? "justify-start py-3 px-4" : "py-2"
          )}
        >
          <User className="h-4 w-4 mr-2" /> 
          <span className={isMobile ? "inline" : "hidden sm:inline"}>Perfil</span>
        </TabsTrigger>
        <TabsTrigger 
          value="whatsapp" 
          className={cn(
            "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg",
            isMobile ? "justify-start py-3 px-4" : "py-2"
          )}
        >
          <MessagesSquare className="h-4 w-4 mr-2" /> 
          <span className={isMobile ? "inline" : "hidden sm:inline"}>WhatsApp</span>
        </TabsTrigger>
        <TabsTrigger 
          value="team" 
          className={cn(
            "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg",
            isMobile ? "justify-start py-3 px-4" : "py-2"
          )}
        >
          <Users className="h-4 w-4 mr-2" /> 
          <span className={isMobile ? "inline" : "hidden sm:inline"}>Equipe</span>
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
