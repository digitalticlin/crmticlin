
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WhatsAppAccount {
  id: string;
  name: string;
  phone: string;
  status: "active" | "connecting" | "disconnected";
}

export default function WhatsApp() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([
    {
      id: "1",
      name: "Atendimento Principal",
      phone: "+55 11 9999-8888",
      status: "active",
    },
    {
      id: "2",
      name: "Vendas",
      phone: "+55 11 9999-7777",
      status: "disconnected",
    },
    {
      id: "3",
      name: "Suporte",
      phone: "+55 11 9999-6666",
      status: "connecting",
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case "connecting":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Conectando</Badge>;
      case "disconnected":
        return <Badge className="bg-red-500 hover:bg-red-600">Desconectado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Gestão de WhatsApp</h1>
              <p className="text-muted-foreground">Gerencie seus números e conexões do WhatsApp</p>
            </div>
            <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Novo Número
            </Button>
          </div>
          
          {/* WhatsApp Accounts */}
          <div className="grid gap-6 mb-6">
            <ChartCard 
              title="Números Conectados" 
              description="Gerencie seus números do WhatsApp"
            >
              <div className="space-y-4 mt-4">
                {accounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="flex items-center justify-between p-4 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="font-medium text-lg">{account.name}</div>
                      <div className="text-sm text-muted-foreground">{account.phone}</div>
                      {getStatusBadge(account.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 px-2">
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Reconectar</span>
                      </Button>
                      <Button variant="destructive" size="sm" className="h-8 px-2">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Remover</span>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {accounts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum número conectado. Adicione seu primeiro número para começar.</p>
                  </div>
                )}
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Limites do Plano" 
              description="Seu plano atual permite até 5 números de WhatsApp"
            >
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-ticlin h-2.5 rounded-full" 
                    style={{ width: `${Math.min((accounts.length / 5) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span>{accounts.length} de 5 números utilizados</span>
                  <span>{5 - accounts.length} restantes</span>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      </main>
    </div>
  );
}
