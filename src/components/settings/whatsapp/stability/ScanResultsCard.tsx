
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ScanResultsCardProps {
  lastScanResult: {
    found: any[];
    recovered: number;
    errors: string[];
  } | null;
}

export function ScanResultsCard({ lastScanResult }: ScanResultsCardProps) {
  if (!lastScanResult) return null;

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
        {lastScanResult.errors.length > 0 ? (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        Último Resultado da Busca
      </h4>
      <div className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <span>Instâncias Órfãs Encontradas:</span>
          <Badge variant="outline">{lastScanResult.found.length}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Instâncias Recuperadas:</span>
          <Badge variant={lastScanResult.recovered > 0 ? "default" : "secondary"}>
            {lastScanResult.recovered}
          </Badge>
        </div>
        {lastScanResult.errors.length > 0 && (
          <>
            <div className="flex justify-between">
              <span>Erros:</span>
              <Badge variant="destructive">{lastScanResult.errors.length}</Badge>
            </div>
            <div className="mt-2 p-2 bg-red-50 rounded text-xs">
              <strong>Detalhes dos erros:</strong>
              <ul className="mt-1 space-y-1">
                {lastScanResult.errors.map((error: string, index: number) => (
                  <li key={index} className="text-red-700">• {error}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
