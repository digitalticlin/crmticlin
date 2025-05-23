
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Settings() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ResponsiveSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className={cn(
          "p-4 md:p-6",
          isMobile && "pt-6"
        )}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold">Configurações</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gerencie as configurações da sua conta e preferências
            </p>
          </div>
          
          <SettingsTabs />
        </div>
      </main>
    </div>
  );
}
