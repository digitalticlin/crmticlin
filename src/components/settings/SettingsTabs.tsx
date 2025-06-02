
import { useState, Suspense, lazy } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { User, MessagesSquare, Users, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load components to prevent simultaneous rendering
const ProfileSettings = lazy(() => import("./ProfileSettings"));
const WhatsAppSettings = lazy(() => import("./WhatsAppSettings"));
const TeamSettings = lazy(() => import("./TeamSettings"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
  </div>
);

const SettingsTabs = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");

  console.log('[SettingsTabs] Rendering with active tab:', activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className={cn(
        "grid h-auto p-1 glass-card border-0 rounded-xl",
        isMobile ? "grid-cols-1 w-full gap-1" : "grid-cols-3"
      )}>
        <TabsTrigger 
          value="profile" 
          className={cn(
            "data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-lg rounded-lg transition-all duration-200",
            isMobile ? "justify-start py-3 px-4" : "py-2"
          )}
        >
          <User className="h-4 w-4 mr-2" /> 
          <span className={isMobile ? "inline" : "hidden sm:inline"}>Perfil</span>
        </TabsTrigger>
        <TabsTrigger 
          value="whatsapp" 
          className={cn(
            "data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-lg rounded-lg transition-all duration-200",
            isMobile ? "justify-start py-3 px-4" : "py-2"
          )}
        >
          <MessagesSquare className="h-4 w-4 mr-2" /> 
          <span className={isMobile ? "inline" : "hidden sm:inline"}>WhatsApp</span>
        </TabsTrigger>
        <TabsTrigger 
          value="team" 
          className={cn(
            "data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-lg rounded-lg transition-all duration-200",
            isMobile ? "justify-start py-3 px-4" : "py-2"
          )}
        >
          <Users className="h-4 w-4 mr-2" /> 
          <span className={isMobile ? "inline" : "hidden sm:inline"}>Equipe</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileSettings />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
      
      <TabsContent value="whatsapp" className="space-y-4">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <WhatsAppSettings />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="team" className="space-y-4">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <TeamSettings />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
