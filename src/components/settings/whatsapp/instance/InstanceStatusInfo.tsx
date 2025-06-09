import { Wifi, WifiOff, QrCode, Clock, AlertCircle } from "lucide-react";
import { WhatsAppWebInstance } from "@/types/whatsapp";

interface StatusInfo {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  canRetry: boolean;
}

export const getStatusInfo = (instance: WhatsAppWebInstance): StatusInfo => {
  if (instance.connection_status === 'connected' || instance.connection_status === 'open') {
    return {
      label: 'Conectado',
      description: 'WhatsApp ativo e funcionando',
      icon: Wifi,
      color: 'bg-emerald-500/20 text-emerald-700 border-emerald-300/50',
      bgGradient: 'from-emerald-50/80 to-green-100/60',
      canRetry: false
    };
  }
  
  if (instance.web_status === 'waiting_scan' && instance.qr_code) {
    return {
      label: 'Aguardando QR Code',
      description: 'Escaneie o código QR para conectar',
      icon: QrCode,
      color: 'bg-blue-500/20 text-blue-700 border-blue-300/50',
      bgGradient: 'from-blue-50/80 to-sky-100/60',
      canRetry: false
    };
  }
  
  if (instance.web_status === 'connecting' || instance.connection_status === 'connecting') {
    return {
      label: 'Conectando',
      description: 'Estabelecendo conexão...',
      icon: Clock,
      color: 'bg-amber-500/20 text-amber-700 border-amber-300/50',
      bgGradient: 'from-amber-50/80 to-orange-100/60',
      canRetry: false
    };
  }

  if (instance.web_status === 'error' || instance.connection_status === 'error') {
    return {
      label: 'Erro de Conexão',
      description: 'Problema na conexão. Tente novamente.',
      icon: WifiOff,
      color: 'bg-red-500/20 text-red-700 border-red-300/50',
      bgGradient: 'from-red-50/80 to-pink-100/60',
      canRetry: true
    };
  }
  
  return {
    label: 'Pronto para Conectar',
    description: 'Gere o QR Code para começar',
    icon: AlertCircle,
    color: 'bg-gray-500/20 text-gray-700 border-gray-300/50',
    bgGradient: 'from-gray-50/80 to-slate-100/60',
    canRetry: true
  };
};
