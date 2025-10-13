import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Automation() {
  return (
    <div className="h-full flex flex-col">
      <ModernPageHeader
        title="Automação"
        description="Funcionalidade de automação em desenvolvimento"
      />

      <div className="flex-1 flex items-center justify-center">
        <Alert className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 shadow-glass max-w-2xl">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            A funcionalidade de campanhas de disparo em massa foi removida.
            Utilize os Fluxos de Atendimento para automatizar suas conversas.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
