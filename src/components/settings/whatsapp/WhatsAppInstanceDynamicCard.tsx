
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
    <div className="flex justify-center items-center">
      <Card
        className={`
          w-full max-w-sm mx-auto rounded-2xl border border-gray-200 dark:border-white/10
          bg-white/70 dark:bg-[#23272e]/60 shadow-md
          backdrop-blur-[10px]
          p-0
          flex flex-col items-center
          transition-all duration-200
          min-h-[260px]
        `}
        style={{ boxShadow: "0 4px 24px 0 rgba(20,20,40,0.05)" }}
      >
        <CardContent className="w-full flex flex-col items-center justify-center px-8 py-7 gap-5">
          <div className="flex flex-col items-center gap-2 w-full">
            <MessageSquare className="w-10 h-10 text-ticlin mb-2" />
            <h4 className="font-bold text-center text-lg text-gray-900 dark:text-white mb-0">
              {isConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
            </h4>
            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm gap-1">
              <span className="font-medium">
                Nome:
              </span>
              <span className="font-mono text-xs truncate max-w-[140px]">{instanceName}</span>
            </div>
            {isConnected && phoneNumber && (
              <div className="flex items-center gap-1 mt-1 text-green-700 dark:text-green-400 text-sm">
                <Phone className="w-4 h-4" />
                <span className="font-bold">{phoneNumber}</span>
              </div>
            )}
          </div>
          {/* Status visual minimalista */}
          <div className="w-full flex justify-center">
            {isConnected ? (
              <span className="px-4 py-1 rounded-full bg-green-100/70 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold tracking-wide shadow-none border-0">
                Conectado ao WhatsApp
              </span>
            ) : (
              <span className="px-4 py-1 rounded-full bg-red-100/60 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-xs font-semibold tracking-wide border-0">
                Desconectado
              </span>
            )}
          </div>
          {/* Botão de deletar só se desconectado */}
          {isDisconnected && (
            <Button
              variant="destructive"
              className="mt-4 w-full font-bold"
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
