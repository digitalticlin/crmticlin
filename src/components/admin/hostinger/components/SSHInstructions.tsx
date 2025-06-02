
import { Terminal } from "lucide-react";

interface SSHInstructionsProps {
  deployResult: any;
}

export const SSHInstructions = ({ deployResult }: SSHInstructionsProps) => {
  if (!deployResult || deployResult.success || !deployResult.ssh_instructions) {
    return null;
  }

  return (
    <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
      <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
        <Terminal className="h-4 w-4" />
        Deploy Manual Otimizado Necessário
      </h4>
      <div className="text-xs text-yellow-700 space-y-2">
        <div><strong>1.</strong> {deployResult.ssh_instructions.step1}</div>
        <div><strong>2.</strong> {deployResult.ssh_instructions.step2}</div>
        <div><strong>3.</strong> {deployResult.ssh_instructions.step3}</div>
        <div><strong>4.</strong> {deployResult.ssh_instructions.step4}</div>
        
        {deployResult.improvements && (
          <div className="mt-2 p-2 bg-yellow-50 rounded">
            <div className="font-medium mb-1">🚀 Melhorias no Script:</div>
            <div className="space-y-1">
              {Object.entries(deployResult.improvements).map(([key, value]: [string, any]) => (
                <div key={key}>• {value}</div>
              ))}
            </div>
          </div>
        )}
        
        {deployResult.deploy_script && (
          <div className="mt-2">
            <div className="font-medium mb-1">Script Otimizado:</div>
            <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
              {deployResult.deploy_script.substring(0, 500)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
