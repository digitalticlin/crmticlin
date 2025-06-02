
import { HostingerVPSPanel } from "./hostinger/HostingerVPSPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Zap, Shield, CloudCog } from "lucide-react";

export const VPSTestPanel = () => {
  return (
    <div className="space-y-6">
      {/* Header informativo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CloudCog className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-blue-800">Nova Integração Hostinger API</CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            Controle total da VPS via API oficial da Hostinger - Sem necessidade de SSH manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">Instalação Automática</div>
                <div className="text-sm text-muted-foreground">WhatsApp Web.js com um clique</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Correções SSL</div>
                <div className="text-sm text-muted-foreground">Aplicadas automaticamente</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">API Oficial</div>
                <div className="text-sm text-muted-foreground">Integração nativa Hostinger</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✅ Token Configurado
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              🚀 Pronto para Uso
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Painel principal da Hostinger */}
      <HostingerVPSPanel />
    </div>
  );
};
