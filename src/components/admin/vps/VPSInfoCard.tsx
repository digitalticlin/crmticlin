
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Globe, HardDrive, Cpu, MemoryStick } from "lucide-react";

export const VPSInfoCard = () => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-800">Informações da VPS</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="font-medium">IP Público:</span>
                <code className="bg-white px-2 py-1 rounded text-sm">31.97.24.222</code>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Provedor:</span>
                <span>Hostinger VPS</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                <span className="font-medium">CPU:</span>
                <span>2 vCPU</span>
              </div>
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-blue-600" />
                <span className="font-medium">RAM:</span>
                <span>4GB DDR4</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                ✅ SSH Configurado
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                ✅ Firewall Ativo
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                🚀 Deploy Permanente
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
