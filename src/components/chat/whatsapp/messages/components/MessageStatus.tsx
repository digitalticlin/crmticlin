
import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'error' | 'failed' | 'sending';
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'sending':
        return <Clock className="w-3 h-3 text-white/60 animate-pulse" />;
      case 'sent':
        return <Check className="w-3 h-3 text-white/60" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-white/60" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Send className="w-3 h-3 text-white/50" />;
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {getStatusIcon()}
    </div>
  );
}
