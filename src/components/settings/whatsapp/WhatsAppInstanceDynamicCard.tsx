
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppInstanceDynamicCardProps {
  instance: {
    id: string;
    instanceName: string;
    phoneNumber?: string;
    status: "connected" | "connecting" | "disconnected";
  };
  onDeleteSuccess: (id: string) => void;
}

const EVOLUTION_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

export default function WhatsAppInstanceDynamicCard({
  instance,
  onDeleteSuccess,
}: WhatsAppInstanceDynamicCardProps) {
  const { id, instanceName, phoneNumber, status } = instance;
  const isConnected = status === "connected" || status === "connecting";
  const isDisconnected = status === "disconnected";

  // Botão de deletar
  const handleDelete = async () => {
    try {
      const resp = await fetch(
        `${EVOLUTION_URL}/instance/delete/${encodeURIComponent(instanceName)}`,
        {
          method: "DELETE",
          headers: {
            apikey: API_KEY,
          },
        }
      );
      const data = await resp.json();
      if (!resp.ok || data?.status !== "SUCCESS") {
        throw new Error(
          data?.response?.message ||
            "Erro ao deletar instância na Evolution API"
        );
      }
      toast.success("Instância removida com sucesso!");
      onDeleteSuccess(id);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao deletar instância");
    }
  };

  return (
    <div className="flex w-full justify-center items-center">
      <Card
        className={`
          w-full max-w-xs mx-auto rounded-2xl 
          border border-white/15 dark:border-white/10
          bg-white/30 dark:bg-[#23272e]/50
          backdrop-blur-xl shadow-glass
          flex flex-col items-center justify-center
          p-0
          min-h-[240px]
          transition-all duration-200
        `}
        style={{
          boxShadow:
            "0 6px 36px 0 rgba(20,20,40,0.08), 0 1.5px 6px 0 rgba(0,0,0,0.03)",
          background:
            "linear-gradient(124deg, rgba(255,255,255,0.58) 70%, rgba(230,235,255,0.07) 100%)",
        }}
      >
        <CardContent className="w-full flex flex-col items-center justify-center px-7 py-7 gap-5">
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="flex items-center justify-center rounded-full bg-white/70 dark:bg-gray-800/70 shadow p-3 mb-0.5">
              <MessageSquare className="w-7 h-7 text-ticlin" />
            </span>
            <h4 className="font-bold text-center text-lg text-gray-900 dark:text-white mb-0 tracking-tight">
              {isConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
            </h4>
            <div className="flex items-center text-neutral-700 dark:text-gray-300 text-xs gap-1 mt-1">
              <span className="font-semibold">Nome:</span>
              <span className="font-mono truncate max-w-[120px] text-xs">{instanceName}</span>
            </div>
            {isConnected && phoneNumber && (
              <div className="flex items-center gap-1 mt-2 text-green-700 dark:text-green-400 text-xs">
                <Phone className="w-4 h-4" />
                <span className="font-bold">{phoneNumber}</span>
              </div>
            )}
          </div>
          <div className="w-full flex justify-center">
            {isConnected ? (
              <span className="px-4 py-1 rounded-full bg-green-100/60 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-[11px] font-bold shadow-none border-0 tracking-wide">
                Conectado ao WhatsApp
              </span>
            ) : (
              <span className="px-4 py-1 rounded-full bg-red-100/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-[11px] font-bold border-0 tracking-wide">
                Desconectado
              </span>
            )}
          </div>
          {isDisconnected && (
            <Button
              variant="destructive"
              className="mt-4 w-full font-semibold text-sm rounded-xl shadow-sm"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 w-4 h-4" />
              Deletar Instância
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

