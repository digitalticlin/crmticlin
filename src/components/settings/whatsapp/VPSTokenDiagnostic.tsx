
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Server, Loader2 } from "lucide-react";
import { DiagnosticResultsDisplay } from "./diagnostic/DiagnosticResultsDisplay";
import { TokenUpdateForm } from "./diagnostic/TokenUpdateForm";
import { useDiagnosticTests } from "./diagnostic/useDiagnosticTests";

export const VPSTokenDiagnostic = () => {
  const { isRunning, results, runDiagnostic } = useDiagnosticTests();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Diagnóstico de Token VPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diagnóstico */}
        <div>
          <Button 
            onClick={runDiagnostic}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando Diagnóstico...
              </>
            ) : (
              <>
                <Server className="h-4 w-4 mr-2" />
                Executar Diagnóstico Completo
              </>
            )}
          </Button>
        </div>

        {/* Resultados */}
        <DiagnosticResultsDisplay results={results} />

        {/* Atualização de Token */}
        <TokenUpdateForm />
      </CardContent>
    </Card>
  );
};
