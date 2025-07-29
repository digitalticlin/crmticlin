
import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'error' | 'failed';
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'sent':
        return <Check className="w-4 h-4 text-white/70" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-white/70" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-400" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Send className="w-4 h-4 text-white/50" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Enviando...';
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'read':
        return 'Lido';
      case 'error':
      case 'failed':
        return 'Erro';
      default:
        return 'Enviando';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs",
      className
    )}>
      {getStatusIcon()}
      <span className="hidden sm:inline text-white/60">
        {getStatusText()}
      </span>
    </div>
  );
}
