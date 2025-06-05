
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestTube } from "lucide-react";
import { VPSInstanceCreationTester } from "@/components/admin/vps/VPSInstanceCreationTester";

export const WhatsAppDiagnosticTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          Diagnóstico de Criação de Instâncias
        </CardTitle>
        <p className="text-sm text-gray-600">
          Use este teste para identificar em qual etapa está ocorrendo o erro de criação de instâncias WhatsApp
        </p>
      </CardHeader>
      <CardContent>
        <VPSInstanceCreationTester />
      </CardContent>
    </Card>
  );
};
