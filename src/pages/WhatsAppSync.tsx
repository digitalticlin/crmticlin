
import { WhatsAppSyncTest } from "@/components/admin/WhatsAppSyncTest";
import Sidebar from "@/components/layout/Sidebar";

export default function WhatsAppSync() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Sincronização WhatsApp</h1>
            <p className="text-muted-foreground">
              Sincronizar instâncias da Evolution API with o banco de dados
            </p>
          </div>
          
          <WhatsAppSyncTest />
        </div>
      </main>
    </div>
  );
}
