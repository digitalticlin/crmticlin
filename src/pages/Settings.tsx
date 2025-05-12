
import Sidebar from "@/components/layout/Sidebar";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default function Settings() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações da sua conta e preferências</p>
          </div>
          
          <SettingsTabs />
        </div>
      </main>
    </div>
  );
}
