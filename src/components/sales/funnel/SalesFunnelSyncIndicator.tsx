
/**
 * 🚀 INDICADOR VISUAL DE SINCRONIZAÇÃO PARA SALES FUNNEL
 * 
 * Mostra status de conexão realtime com animações suaves
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalesFunnelSyncIndicatorProps {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  totalEvents: number;
  lastUpdate: number | null;
  className?: string;
}

export const SalesFunnelSyncIndicator: React.FC<SalesFunnelSyncIndicatorProps> = ({
  isConnected,
  connectionStatus,
  totalEvents,
  lastUpdate,
  className
}) => {
  
  // 🎨 CONFIGURAÇÃO VISUAL POR STATUS
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      color: 'bg-green-500',
      text: 'Sincronizado',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    connecting: {
      icon: RefreshCw,
      color: 'bg-yellow-500',
      text: 'Conectando...',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    disconnected: {
      icon: WifiOff,
      color: 'bg-gray-500',
      text: 'Desconectado',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    },
    error: {
      icon: AlertCircle,
      color: 'bg-red-500',
      text: 'Erro',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  };

  const config = statusConfig[connectionStatus];
  const Icon = config.icon;

  // 🕒 FORMATAÇÃO DO ÚLTIMO UPDATE
  const formatLastUpdate = (timestamp: number | null) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 1000) return 'agora';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s atrás`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    return `${Math.floor(diff / 3600000)}h atrás`;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg",
      "bg-white/40 backdrop-blur-sm border border-white/20",
      "transition-all duration-200",
      className
    )}>
      
      {/* 📡 STATUS ICON COM ANIMAÇÃO */}
      <div className="relative">
        <div className={cn(
          "w-2 h-2 rounded-full",
          config.color,
          connectionStatus === 'connecting' && "animate-pulse"
        )} />
        
        {/* Efeito de pulsação para conexão ativa */}
        {isConnected && (
          <div className={cn(
            "absolute inset-0 w-2 h-2 rounded-full",
            config.color,
            "animate-ping opacity-75"
          )} />
        )}
      </div>

      {/* 📊 BADGE COM STATUS */}
      <Badge className={cn(
        "text-xs font-medium",
        config.badge
      )}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>

      {/* 🔢 CONTADOR DE EVENTOS */}
      {totalEvents > 0 && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {totalEvents} eventos
        </span>
      )}

      {/* 🕒 ÚLTIMO UPDATE */}
      {lastUpdate && (
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {formatLastUpdate(lastUpdate)}
        </span>
      )}
    </div>
  );
};
