
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
  const lemonNeon = "#F9FF66";

  return (
    <div className="w-full flex justify-center items-center">
      <Card
        className={`
          flex flex-row items-center w-full max-w-2xl min-h-[110px] p-0 bg-white/10 dark:bg-card/10 border-2 border-white/10 dark:border-white/10
          rounded-2xl shadow-glass-lg overflow-hidden transition-colors duration-300
          hover:border-[${lemonNeon}]
          ring-1 ring-white/5
        `}
        style={{ boxShadow: "0 8px 40px 0 rgba(16,20,29,0.20)" }}
      >
        {/* SIDE - Ícone limão */}
        <div className="flex flex-col items-center justify-center h-full px-8 py-5 bg-[#F9FF66]/20 border-r border-white/10">
          <MessageSquare className="w-10 h-10 text-[#F9FF66]" />
        </div>

        {/* MAIN - Conteúdo principal */}
        <div className="flex flex-1 flex-row items-center justify-between px-8 py-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-white/70 uppercase tracking-wider mb-0.5">WhatsApp</span>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xl font-bold text-white truncate max-w-[240px]">{instanceName}</h4>
              <span
                className={`
                  whitespace-nowrap px-3 py-0.5 rounded-full text-xs font-semibold shadow
                  ${
                    status === "connected"
                      ? "bg-[#F9FF66]/90 text-gray-900"
                      : status === "connecting"
                      ? "bg-zinc-200/80 text-gray-700 dark:bg-zinc-800/70 dark:text-white"
                      : "bg-zinc-950/70 text-zinc-300 border border-white/10"
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
            {/* Telefone: exibe SÓ se conectado */}
            {isConnected && phoneNumber && (
              <div className="flex items-center gap-2 font-mono text-base text-[#F9FF66] mt-2 truncate">
                <Phone className="w-4 h-4 text-[#F9FF66]" />
                <span className="font-semibold truncate">{phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2 ml-8">
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
        </div>
      </Card>
    </div>
  );
}
