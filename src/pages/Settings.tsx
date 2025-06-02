
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default function Settings() {
  return (
    <PageLayout>
      <ModernPageHeader 
        title="Configurações" 
        description="Gerencie as configurações da sua conta e preferências"
      />
      
      <SettingsTabs />
    </PageLayout>
  );
}
