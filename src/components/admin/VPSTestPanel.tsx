
import { AutoDeployButton } from "./hostinger/AutoDeployButton";
import { PortTestDiagnostic } from "./vps/PortTestDiagnostic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Terminal, CheckCircle } from "lucide-react";

export const VPSTestPanel = () => {
  return (
    <div className="space-y-6">
      {/* Header informativo */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-800">Deploy VPS Automático</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            🚀 Deploy automático em execução - Servidor WhatsApp Web.js sendo instalado via SSH
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">Deploy Automático</div>
                <div className="text-sm text-muted-foreground">Instalação em andamento</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Servidor Permanente</div>
                <div className="text-sm text-muted-foreground">PM2 com auto-restart</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Portas Configuradas</div>
                <div className="text-sm text-muted-foreground">80 (API) + 3001 (WhatsApp)</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✅ SSH Configurado
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✅ Firewall Liberado
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              🚀 Deploy em Execução
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Deploy automático em execução */}
      <AutoDeployButton />

      {/* Teste de conectividade pós-deploy */}
      <PortTestDiagnostic />
    </div>
  );
};
