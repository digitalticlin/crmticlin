
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { Settings as SettingsIcon, Sparkles } from "lucide-react";

export default function Settings() {
  return (
    <PageLayout>
      <ModernPageHeader 
        title="Configurações" 
        description="Gerencie as configurações da sua conta e preferências do sistema"
        icon={SettingsIcon}
      />
      
      <SettingsTabs />
    </PageLayout>
  );
}
