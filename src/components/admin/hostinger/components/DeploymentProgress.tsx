
import { Activity, RotateCcw, CheckCircle } from "lucide-react";
import { DeployStatus } from "../hooks/useAutoDeploy";

interface DeploymentProgressProps {
  deployStatus: DeployStatus;
  isDeploying: boolean;
  servicesOnline: boolean;
}

export const DeploymentProgress = ({ deployStatus, isDeploying, servicesOnline }: DeploymentProgressProps) => {
  if (deployStatus === 'idle') {
    return (
      <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Melhorias Implementadas
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>⏱️ Timeout aumentado: 5s → 15s</div>
          <div>🔄 Retry automático: até 3 tentativas</div>
          <div>🧹 Limpeza PM2: remove duplicatas</div>
          <div>🎯 Verificação robusta: 5 tentativas finais</div>
        </div>
      </div>
    );
  }

  if (deployStatus === 'checking') {
    return (
      <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse" />
          Verificação com Retry
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>🔍 Testando API Server (timeout 15s)...</div>
          <div>📱 Testando WhatsApp Server (timeout 15s)...</div>
          <div>🔄 Retry automático habilitado...</div>
        </div>
      </div>
    );
  }

  if (isDeploying && deployStatus === 'deploying') {
    return (
      <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse" />
          Deploy Otimizado em Andamento
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>🧹 Limpando instâncias PM2 duplicadas...</div>
          <div>🔧 Configurando API Server (porta 80)...</div>
          <div>📱 Configurando WhatsApp Server (porta 3001)...</div>
          <div>⚡ Iniciando serviços com PM2...</div>
          <div>🎯 Verificação robusta com 5 tentativas...</div>
        </div>
      </div>
    );
  }

  if (deployStatus === 'success' && servicesOnline) {
    return (
      <div className="p-3 bg-green-100 rounded-lg border border-green-300">
        <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Serviços Online - Verificação Otimizada
        </h4>
        <div className="text-sm text-green-700 space-y-1">
          <div>✅ API Server: Ativo na porta 80</div>
          <div>✅ WhatsApp Server: Ativo na porta 3001</div>
          <div>✅ PM2: Gerenciamento ativo</div>
          <div>✅ Timeout estendido funcionando</div>
          <div>✅ Sistema de retry implementado</div>
        </div>
      </div>
    );
  }

  return null;
};
