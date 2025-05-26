
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isMobile = useIsMobile();

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
        className={cn(
          // Outras classes já existentes...
          "w-full max-w-sm md:max-w-md rounded-2xl border border-white/10 dark:border-white/10",
          "bg-white/5 dark:bg-[#20232a]/30 backdrop-blur-md shadow-glass",
          "flex flex-col items-center justify-center px-0 py-0",
          "transition-all duration-200 min-h-[260px] md:min-h-[250px] md:min-w-[450px]"
        )}
        style={{
          boxShadow:
            "0 8px 40px 0 rgba(16,20,29,0.11), 0 2px 10px 0 rgba(0,0,0,0.04)",
          background:
            "linear-gradient(125deg, rgba(30,32,39,0.94) 60%, rgba(28,28,36,0.88) 100%)",
        }}
      >
        <CardContent
          className={cn(
            "w-full flex flex-col items-center justify-between gap-4",
            "p-6 pt-8 pb-6"
          )}
        >
          {/* Ícone largo, espaçado */}
          <span
            className={cn(
              "flex items-center justify-center rounded-full mb-2",
              "bg-white/20 dark:bg-[#21222b]/70 shadow p-4"
            )}
          >
            <MessageSquare className="text-ticlin w-8 h-8 md:w-10 md:h-10" />
          </span>

          {/* Nome + Badge status numa linha centralizada */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-1 w-full justify-center">
              <span
                className={cn(
                  "font-bold font-mono text-base md:text-lg text-white truncate max-w-[170px] md:max-w-[220px]"
                )}
                title={instanceName}
              >
                {instanceName}
              </span>
              <span>
                {isConnected ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100/80 text-green-700 dark:bg-green-800/35 dark:text-green-200">
                    Conectado
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200/60 text-red-700 dark:bg-red-700/20 dark:text-red-200">
                    Desconectado
                  </span>
                )}
              </span>
            </div>
            {/* Telefone */}
            {isConnected && phoneNumber && (
              <div className="flex items-center gap-1 text-green-300 dark:text-green-400 text-sm mt-1 mb-0.5">
                <Phone className="w-4 h-4" />
                <span className="font-semibold">{phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Espaço extra */}
          <div className="flex-1" />

          {/* Botão deletar centralizado para desconectado apenas */}
          {isDisconnected && (
            <Button
              variant="destructive"
              className="mt-4 mx-auto w-40 font-bold rounded-xl shadow-lg transition-all"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 w-5 h-5" />
              Excluir Instância
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

