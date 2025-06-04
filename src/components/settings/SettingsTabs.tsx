
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
    <div className="text-center space-y-4">
      <div className="relative mx-auto w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#D3D800]/30"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D3D800] animate-spin"></div>
      </div>
      <p className="text-sm text-gray-700">Carregando configurações...</p>
    </div>
  </div>
);

const SettingsTabs = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");

  console.log('[SettingsTabs] Rendering with active tab:', activeTab);

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className={cn(
          "grid h-auto p-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl",
          isMobile ? "grid-cols-1 w-full gap-2" : "grid-cols-3 w-fit mx-auto"
        )}>
          <TabsTrigger 
            value="profile" 
            className={cn(
              "relative overflow-hidden transition-all duration-300 rounded-xl px-6 py-4",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D3D800]/20 data-[state=active]:to-[#D3D800]/10",
              "data-[state=active]:backdrop-blur-lg data-[state=active]:border data-[state=active]:border-[#D3D800]/30",
              "data-[state=active]:shadow-lg data-[state=active]:text-gray-800",
              "hover:bg-white/20 text-gray-700 hover:text-gray-800",
              isMobile ? "justify-start" : "justify-center"
            )}
          >
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" />
              <span className="font-medium">Perfil</span>
            </div>
            {activeTab === "profile" && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#D3D800]/5 to-transparent rounded-xl animate-fade-in" />
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="whatsapp" 
            className={cn(
              "relative overflow-hidden transition-all duration-300 rounded-xl px-6 py-4",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D3D800]/20 data-[state=active]:to-[#D3D800]/10",
              "data-[state=active]:backdrop-blur-lg data-[state=active]:border data-[state=active]:border-[#D3D800]/30",
              "data-[state=active]:shadow-lg data-[state=active]:text-gray-800",
              "hover:bg-white/20 text-gray-700 hover:text-gray-800",
              isMobile ? "justify-start" : "justify-center"
            )}
          >
            <div className="flex items-center space-x-3">
              <MessagesSquare className="h-5 w-5" />
              <span className="font-medium">WhatsApp</span>
            </div>
            {activeTab === "whatsapp" && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#D3D800]/5 to-transparent rounded-xl animate-fade-in" />
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="team" 
            className={cn(
              "relative overflow-hidden transition-all duration-300 rounded-xl px-6 py-4",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D3D800]/20 data-[state=active]:to-[#D3D800]/10",
              "data-[state=active]:backdrop-blur-lg data-[state=active]:border data-[state=active]:border-[#D3D800]/30",
              "data-[state=active]:shadow-lg data-[state=active]:text-gray-800",
              "hover:bg-white/20 text-gray-700 hover:text-gray-800",
              isMobile ? "justify-start" : "justify-center"
            )}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5" />
              <span className="font-medium">Equipe</span>
            </div>
            {activeTab === "team" && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#D3D800]/5 to-transparent rounded-xl animate-fade-in" />
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4 animate-fade-in">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ProfileSettings />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="whatsapp" className="space-y-4 animate-fade-in">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <WhatsAppSettings />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="team" className="space-y-4 animate-fade-in">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <TeamSettings />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTabs;
