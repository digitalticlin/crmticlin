
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalInstanceSync } from "@/components/admin/GlobalInstanceSync";
import { Link } from "react-router-dom";
import { 
  RefreshCcw, 
  TestTube,
  ArrowRight
} from "lucide-react";

export default function Admin() {
  return (
    <SidebarProvider>
      <PageLayout>
        <ModernPageHeader 
          title="Painel Administrativo" 
          description="Sistema de sincronização e gerenciamento de instâncias WhatsApp"
        />
        
        <div className="space-y-6">
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
        </div>
      </PageLayout>
    </SidebarProvider>
  );
}
