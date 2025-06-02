
import { CheckCircle } from "lucide-react";
import { DeployResults } from "../types/versionDiagnosticTypes";

interface DeployResultsDisplayProps {
  deployResults: DeployResults;
}

export const DeployResultsDisplay = ({ deployResults }: DeployResultsDisplayProps) => {
  return (
    <div className="space-y-4 mt-6">
      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-green-800">Deploy Executado</h4>
        </div>
        
        <div className="space-y-2">
          {deployResults.results?.map((result: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-green-700">{result.message}</span>
            </div>
          ))}
        </div>

        {deployResults.next_steps && (
          <div className="mt-4">
            <div className="text-sm font-medium text-green-800 mb-2">Próximos Passos:</div>
            <ul className="space-y-1">
              {deployResults.next_steps.map((step: string, index: number) => (
                <li key={index} className="text-xs text-green-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
