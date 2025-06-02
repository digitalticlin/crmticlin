
import { CheckCircle, AlertCircle, Zap, Loader2 } from "lucide-react";
import { DeployStatus } from "../hooks/useAutoDeploy";

interface DeployStatusHeaderProps {
  deployStatus: DeployStatus;
  servicesOnline: boolean;
}

export const DeployStatusHeader = ({ deployStatus, servicesOnline }: DeployStatusHeaderProps) => {
  const getStatusIcon = () => {
    switch (deployStatus) {
      case 'checking':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      case 'deploying':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Zap className="h-6 w-6 text-green-600" />;
    }
  };

  const getStatusText = () => {
    switch (deployStatus) {
      case 'checking':
        return 'Verificando status com retry automático...';
      case 'deploying':
        return 'Executando deploy otimizado...';
      case 'success':
        return servicesOnline ? 'Serviços online com verificação otimizada!' : 'Deploy otimizado concluído!';
      case 'error':
        return 'Erro no deploy - Verifique instruções otimizadas';
      default:
        return 'Deploy Otimizado SSH - Timeout 15s + Retry';
    }
  };

  const getStatusColor = () => {
    switch (deployStatus) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'deploying':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="flex items-center gap-3">
      {getStatusIcon()}
      <div>
        <h3 className={`font-semibold ${deployStatus === 'success' ? 'text-green-800' : deployStatus === 'error' ? 'text-red-800' : 'text-blue-800'}`}>
          Deploy Otimizado SSH
        </h3>
        <p className={`text-sm ${deployStatus === 'success' ? 'text-green-700' : deployStatus === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
          {getStatusText()}
        </p>
      </div>
    </div>
  );
};
