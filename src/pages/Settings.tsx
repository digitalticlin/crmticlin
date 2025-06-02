
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default function Settings() {
  return (
    <PageLayout>
      <PageHeader 
        title="Configurações" 
        description="Gerencie as configurações da sua conta e preferências"
      />
      
      <SettingsTabs />
    </PageLayout>
  );
}
