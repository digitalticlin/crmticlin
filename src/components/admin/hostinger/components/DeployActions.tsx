
import { Button } from "@/components/ui/button";
import { Activity, Zap, Loader2, ExternalLink } from "lucide-react";
import { DeployStatus } from "../hooks/useAutoDeploy";

interface DeployActionsProps {
  deployStatus: DeployStatus;
  isDeploying: boolean;
  onCheckServices: () => void;
  onManualDeploy: () => void;
}

export const DeployActions = ({ 
  deployStatus, 
  isDeploying, 
  onCheckServices, 
  onManualDeploy 
}: DeployActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onCheckServices}
        disabled={isDeploying || deployStatus === 'checking'}
        variant="outline"
        className="border-blue-600 text-blue-600"
      >
        {deployStatus === 'checking' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verificando...
          </>
        ) : (
          <>
            <Activity className="h-4 w-4 mr-2" />
            Verificar com Retry
          </>
        )}
      </Button>

      <Button
        onClick={onManualDeploy}
        disabled={isDeploying || deployStatus === 'checking'}
        className={`${deployStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
      >
        {isDeploying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Executando...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Deploy Otimizado
          </>
        )}
      </Button>
      
      {deployStatus === 'success' && (
        <>
          <Button
            variant="outline"
            onClick={() => window.open(`http://31.97.24.222/health`, '_blank')}
            className="border-green-600 text-green-600"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Testar API
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`http://31.97.24.222:3001/health`, '_blank')}
            className="border-green-600 text-green-600"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Testar WhatsApp
          </Button>
        </>
      )}
    </div>
  );
};
