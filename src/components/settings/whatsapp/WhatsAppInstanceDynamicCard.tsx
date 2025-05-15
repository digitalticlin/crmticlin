
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
          w-full max-w-lg mx-auto rounded-2xl
          border border-white/10 dark:border-white/10
          bg-white/5 dark:bg-[#20232a]/30
          backdrop-blur-md shadow-glass
          flex flex-col items-center justify-center
          px-0 py-0
          min-h-[270px]
          transition-all duration-200
        `}
        style={{
          boxShadow:
            "0 8px 40px 0 rgba(16,20,29,0.11), 0 2px 10px 0 rgba(0,0,0,0.04)",
          background:
            "linear-gradient(125deg, rgba(30,32,39,0.94) 60%, rgba(28,28,36,0.88) 100%)",
        }}
      >
        <CardContent className="w-full flex flex-col items-center justify-center px-10 py-10 gap-6">
          {/* Ícone WhatsApp */}
          <span className="flex items-center justify-center rounded-full bg-white/20 dark:bg-[#21222b]/70 shadow p-3 mb-2.5">
            <MessageSquare className="w-8 h-8 text-ticlin" />
          </span>
          {/* Status + Nome */}
          <h4 className="font-extrabold text-center text-xl text-white mb-0 tracking-tight">
            {isConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
          </h4>
          <div className="flex items-center text-white/80 text-base gap-2 mt-1">
            <span className="font-semibold">Nome:</span>
            <span className="font-mono truncate max-w-[170px] text-base">{instanceName}</span>
          </div>
          {/* Telefone conectado */}
          {isConnected && phoneNumber && (
            <div className="flex items-center gap-2 mt-2 text-green-300 dark:text-green-400 text-base">
              <Phone className="w-5 h-5" />
              <span className="font-bold">{phoneNumber}</span>
            </div>
          )}
          {/* Status visual */}
          <div className="w-full flex justify-center mt-2">
            {isConnected ? (
              <span className="px-5 py-2 rounded-full bg-green-200/60 dark:bg-green-800/30 text-green-800 dark:text-green-300 text-[13px] font-semibold border-0 tracking-wide shadow-none">
                Conectado ao WhatsApp
              </span>
            ) : (
              <span className="px-5 py-2 rounded-full bg-red-200/40 dark:bg-red-700/15 text-red-700 dark:text-red-300 text-[13px] font-semibold border-0 tracking-wide">
                Desconectado
              </span>
            )}
          </div>
          {/* Botão de deletar (desconectado) */}
          {isDisconnected && (
            <Button
              variant="destructive"
              className="mt-5 w-full font-bold text-base rounded-xl shadow-lg"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 w-5 h-5" />
              Deletar Instância
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

