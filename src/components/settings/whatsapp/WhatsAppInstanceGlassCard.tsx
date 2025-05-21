
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash, RefreshCcw, Phone } from "lucide-react";
import { toast } from "sonner";

type Props = {
  instance: {
    id: string;
    instanceName: string;
    phoneNumber?: string;
    status: "connected" | "connecting" | "disconnected";
  };
  onDelete: (id: string) => void;
  onRefresh?: (id: string) => void;
  isDeleting?: boolean;
  isLoading?: boolean;
};

export default function WhatsAppInstanceGlassCard({
  instance,
  onDelete,
  onRefresh,
  isDeleting = false,
  isLoading = false,
}: Props) {
  const { id, instanceName, phoneNumber, status } = instance;
  const isConnected = status === "connected" || status === "connecting";
  const isDisconnected = status === "disconnected";

  return (
    <div className="flex w-full justify-center items-center">
      <Card
        className={`
          relative w-full max-w-lg mx-auto rounded-2xl
          bg-white/10 dark:bg-card/10
          border border-white/20 dark:border-white/10
          backdrop-blur-2xl glass-morphism
          shadow-[0_8px_40px_0_rgba(16,20,29,0.15)]
          px-0 py-0 min-h-[300px] transition-all duration-200
          overflow-hidden
        `}
      >
        {/* Neon Accent Bar */}
        <div className="absolute left-4 right-4 top-0 h-1.5 rounded-b-xl z-10" style={{background: 'linear-gradient(90deg, #F9FF66 0%, #eaff65 100%)'}} />
        
        <CardContent className="w-full flex flex-col items-center justify-center px-8 py-10 gap-5">
          {/* WhatsApp Icon haloed in neon */}
          <span className="flex items-center justify-center rounded-full bg-[#F9FF66]/30 shadow-[0_0_10px_2px_#F9FF6680] p-3 mb-1.5">
            <MessageSquare className="w-8 h-8 text-[#F9FF66]" />
          </span>
          {/* Status badge */}
          <span className={`px-4 py-1 rounded-full text-xs font-semibold mb-2 shadow
            ${status === 'connected'
              ? 'bg-[#F9FF66]/90 text-gray-900'
              : 'bg-zinc-100/60 text-gray-800 dark:bg-zinc-800/60 dark:text-white'
            }`}>
            {status === 'connected' ? "Conectado" : (status === "connecting" ? "Conectando..." : "Desconectado")}
          </span>
          {/* Nome da instância */}
          <h4 className="font-bold text-center text-lg text-white/90 mb-1">{instanceName}</h4>
          {/* Telefone conectado */}
          {isConnected && phoneNumber && (
            <div className="flex items-center gap-2 mt-1 text-[#222] dark:text-[#e8fa92] font-mono text-base bg-black/10 dark:bg-white/10 px-3 py-1 rounded-lg">
              <Phone className="w-5 h-5 text-[#F9FF66]" />
              <span className="font-semibold">{phoneNumber}</span>
            </div>
          )}

          {/* Ações (apenas para instâncias desconectadas!) */}
          <div className="flex gap-3 justify-center mt-2">
            {isDisconnected && (
              <Button
                variant="destructive"
                size="icon"
                className="border border-white/20 bg-[#F9FF66]/20 hover:bg-[#F9FF66]/50 shadow"
                onClick={() => onDelete(id)}
                disabled={isDeleting}
              >
                <Trash className="text-red-600" />
              </Button>
            )}
            {!!onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="border border-white/20 hover:bg-[#F9FF66]/20 shadow"
                onClick={() => onRefresh(id)}
                disabled={isLoading}
              >
                <RefreshCcw className="text-[#F9FF66]" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
