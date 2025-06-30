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

export default function Admin() {
  const [activeTab, setActiveTab] = useState("sync");

  return (
    <SidebarProvider>
      <PageLayout>
        <ModernPageHeader 
          title="Painel Administrativo" 
          description="Sistema de administração e diagnóstico completo"
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-white/30">
            <TabsTrigger
              value="sync"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Sincronização
            </TabsTrigger>
            <TabsTrigger
              value="funnel"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Funil de Vendas
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
            {/* Corretor de Números de Telefone */}
            <PhoneNumberFixer />
            
            {/* Link para Página de Testes */}
            <Card className="bg-gradient-to-r from-green-50/30 to-blue-50/30 backdrop-blur-xl rounded-3xl border border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-green-500" />
                  Sistema de Testes Completo
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Acesse a página dedicada para criação dual e testes de instâncias
                </p>
              </CardHeader>
              <CardContent>
                <Link to="/instance-sync-test">
                  <Button className="w-full gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    <TestTube className="h-4 w-4" />
                    Acessar Página de Testes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageLayout>
    </SidebarProvider>
  );
}
