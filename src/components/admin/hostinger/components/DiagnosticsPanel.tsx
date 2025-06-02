
import { Activity } from "lucide-react";

interface DiagnosticsPanelProps {
  diagnostics: any;
}

export const DiagnosticsPanel = ({ diagnostics }: DiagnosticsPanelProps) => {
  if (!diagnostics) {
    return null;
  }

  return (
    <div className="p-3 bg-white rounded-lg border">
      <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Diagnóstico VPS Otimizado
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1 ${diagnostics.vps_ping ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${diagnostics.vps_ping ? 'bg-green-500' : 'bg-red-500'}`}></div>
          Conectividade VPS
        </div>
        <div className={`flex items-center gap-1 ${diagnostics.api_server_running ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${diagnostics.api_server_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
          API Server (Porta 80)
        </div>
        <div className={`flex items-center gap-1 ${diagnostics.whatsapp_server_running ? 'text-green-600' : 'text-gray-600'}`}>
          <div className={`w-2 h-2 rounded-full ${diagnostics.whatsapp_server_running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          WhatsApp Server (3001)
        </div>
        <div className={`flex items-center gap-1 ${diagnostics.pm2_running ? 'text-green-600' : 'text-gray-600'}`}>
          <div className={`w-2 h-2 rounded-full ${diagnostics.pm2_running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          PM2 Auto-restart
        </div>
        {diagnostics.timeout_improved && (
          <div className="flex items-center gap-1 text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Timeout Estendido (15s)
          </div>
        )}
        {diagnostics.retry_enabled && (
          <div className="flex items-center gap-1 text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Retry Automático
          </div>
        )}
      </div>
    </div>
  );
};
