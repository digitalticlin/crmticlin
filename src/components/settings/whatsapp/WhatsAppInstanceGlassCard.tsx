
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash, RefreshCcw, Phone } from "lucide-react";

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

  // Paleta neon
  const lemonNeon = "#F9FF66";

  return (
    <div className="flex w-full justify-center items-center">
      <Card
        className={`
          flex flex-row items-center
          max-w-2xl w-full min-h-[140px] p-4
          bg-white/10 dark:bg-card/10
          border border-white/20 dark:border-white/10
          rounded-2xl shadow-glass-lg
          overflow-hidden
          transition-colors duration-200
          hover:border-[${lemonNeon}]
          group
        `}
        style={{ boxShadow: "0 8px 40px 0 rgba(16,20,29,0.15)" }}
      >
        {/* Ícone à esquerda */}
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#F9FF66]/20 shadow" >
          <MessageSquare className="w-8 h-8 text-[#F9FF66]" />
        </div>
        {/* Conteúdo central (Nome, Status, Telefone) */}
        <div className="ml-6 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-lg font-bold text-white/90 truncate">{instanceName}</h4>
            <span
              className={`
                px-3 py-1 rounded-full text-xs font-semibold shadow
                ${
                  status === "connected"
                    ? "bg-[#F9FF66]/90 text-gray-900"
                    : status === "connecting"
                    ? "bg-zinc-100/80 text-gray-800 dark:bg-zinc-800/70 dark:text-white"
                    : "bg-zinc-200/60 text-gray-800 dark:bg-zinc-900/60 dark:text-white"
                }
              `}
            >
              {status === "connected"
                ? "Conectado"
                : status === "connecting"
                ? "Conectando..."
                : "Desconectado"}
            </span>
          </div>
          {/* Telefone abaixo */}
          {isConnected && phoneNumber && (
            <div className="flex items-center gap-1 mt-2 font-mono text-base text-[#F9FF66] dark:text-[#e8fa92]">
              <Phone className="w-5 h-5 text-[#F9FF66]" />
              <span className="font-semibold truncate">{phoneNumber}</span>
            </div>
          )}
        </div>
        {/* Botões à direita */}
        <div className="flex flex-col gap-2 ml-6">
          {isDisconnected && (
            <Button
              variant="destructive"
              size="icon"
              className="border border-white/20 bg-[#F9FF66]/20 hover:bg-[#F9FF66]/50 shadow"
              onClick={() => onDelete(id)}
              disabled={isDeleting}
              aria-label="Excluir instância"
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
              aria-label="Recarregar status"
            >
              <RefreshCcw className="text-[#F9FF66]" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
