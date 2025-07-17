import { SidebarProvider } from "@/contexts/SidebarContext";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalInstanceSync } from "@/components/admin/GlobalInstanceSync";
import { FunnelDiagnostic } from "@/components/admin/FunnelDiagnostic";
import { Link } from "react-router-dom";
import { 
  RefreshCcw, 
  TestTube,
  ArrowRight,
  TrendingUp,
  Settings
} from "lucide-react";
import { useState } from "react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PhoneNumberFixer } from "@/components/admin/PhoneNumberFixer";
import { RealtimeDebugger } from "@/components/debug/RealtimeDebugger";
import { RealtimeConnectionTest } from "@/components/debug/RealtimeConnectionTest";
import { MessageFlowTester } from "@/components/debug/MessageFlowTester";
import { RealtimeTestResult } from "@/components/debug/RealtimeTestResult";
import { MessagingTest } from "@/components/chat/whatsapp/test/MessagingTest";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("sync");

  return (
    <SidebarProvider>
      <PageLayout>
        <ModernPageHeader 
          title="Painel Administrativo" 
          description="Sistema de administração e diagnóstico completo"
        />
        
        <div className="p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12 bg-white/20 backdrop-blur-sm rounded-xl p-1">
            <TabsTrigger
              value="sync"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
                Sync
            </TabsTrigger>
            <TabsTrigger
              value="funnel"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
                Funil
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Aba de Sincronização */}
          <TabsContent value="sync" className="space-y-6 mt-6">
            {/* Sincronização Global de Instâncias */}
            <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 text-blue-500" />
                  Sincronização VPS ↔ Supabase
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Sincronização global entre instâncias da VPS e banco de dados Supabase
                </p>
              </CardHeader>
              <CardContent>
                <GlobalInstanceSync />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Diagnóstico do Funil */}
          <TabsContent value="funnel" className="mt-6">
            <FunnelDiagnostic />
          </TabsContent>

          {/* Aba do Sistema */}
          <TabsContent value="system" className="space-y-6 mt-6">
              {/* Teste de Envio de Mensagens */}
              <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-green-500" />
                    Teste de Envio de Mensagens
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Teste o sistema de envio de mensagens via Edge Function → VPS
                  </p>
                </CardHeader>
                <CardContent>
                  <MessagingTest />
                </CardContent>
              </Card>

              {/* Teste Rápido de Correções */}
              <RealtimeTestResult />

              {/* Teste de Conexão Realtime */}
              <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-blue-500" />
                    Teste de Conexão Realtime
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Diagnóstico completo da conexão Supabase Realtime
                  </p>
                </CardHeader>
                <CardContent>
                  <RealtimeConnectionTest />
                </CardContent>
              </Card>

              {/* Debug do Realtime */}
              <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-purple-500" />
                    Debug Realtime Supabase
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Monitor avançado de eventos realtime
                  </p>
                </CardHeader>
                <CardContent>
                  <RealtimeDebugger />
                </CardContent>
              </Card>

              {/* Teste de Fluxo Completo */}
              <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-green-500" />
                    Teste de Fluxo Completo
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Teste completo do fluxo: inserção → realtime → UI
                  </p>
                </CardHeader>
                <CardContent>
                  <MessageFlowTester />
                </CardContent>
              </Card>

            {/* Corretor de Números de Telefone */}
            <PhoneNumberFixer />
            
            {/* Link para Página de Testes */}
            <Card className="bg-gradient-to-r from-green-50/30 to-blue-50/30 backdrop-blur-xl rounded-3xl border border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-green-500" />
                    Página de Testes Avançados
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Acesse a página com todos os testes de administração
                </p>
              </CardHeader>
              <CardContent>
                  <Link to="/tests">
                    <Button className="flex items-center gap-2">
                      Ir para Testes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </PageLayout>
    </SidebarProvider>
  );
}
