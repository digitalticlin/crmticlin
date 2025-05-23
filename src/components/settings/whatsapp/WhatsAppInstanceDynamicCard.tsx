
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
          "w-full rounded-2xl border border-white/10 dark:border-white/10",
          "bg-white/5 dark:bg-[#20232a]/30 backdrop-blur-md shadow-glass",
          "flex flex-col items-center justify-center px-0 py-0",
          "transition-all duration-200",
          isMobile ? "min-h-[240px] max-w-sm" : "min-h-[270px] max-w-lg"
        )}
        style={{
          boxShadow:
            "0 8px 40px 0 rgba(16,20,29,0.11), 0 2px 10px 0 rgba(0,0,0,0.04)",
          background:
            "linear-gradient(125deg, rgba(30,32,39,0.94) 60%, rgba(28,28,36,0.88) 100%)",
        }}
      >
        <CardContent className={cn(
          "w-full flex flex-col items-center justify-center gap-4",
          isMobile ? "px-6 py-6" : "px-10 py-10"
        )}>
          {/* WhatsApp Icon */}
          <span className={cn(
            "flex items-center justify-center rounded-full",
            "bg-white/20 dark:bg-[#21222b]/70 shadow p-3",
            isMobile ? "mb-1" : "mb-2.5"
          )}>
            <MessageSquare className={cn(
              "text-ticlin",
              isMobile ? "w-6 h-6" : "w-8 h-8"
            )} />
          </span>

          {/* Status + Name */}
          <h4 className={cn(
            "font-extrabold text-center text-white mb-0 tracking-tight",
            isMobile ? "text-lg" : "text-xl"
          )}>
            {isConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
          </h4>

          <div className={cn(
            "flex items-center text-white/80 gap-2 mt-1",
            isMobile ? "text-sm flex-col" : "text-base flex-row"
          )}>
            <span className="font-semibold">Nome:</span>
            <span className={cn(
              "font-mono truncate text-center",
              isMobile ? "max-w-[200px] text-sm" : "max-w-[170px] text-base"
            )}>
              {instanceName}
            </span>
          </div>

          {/* Connected Phone */}
          {isConnected && phoneNumber && (
            <div className={cn(
              "flex items-center gap-2 mt-2 text-green-300 dark:text-green-400",
              isMobile ? "text-sm" : "text-base"
            )}>
              <Phone className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
              <span className="font-bold">{phoneNumber}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="w-full flex justify-center mt-2">
            {isConnected ? (
              <span className={cn(
                "px-4 py-2 rounded-full bg-green-200/60 dark:bg-green-800/30",
                "text-green-800 dark:text-green-300 font-semibold border-0",
                "tracking-wide shadow-none",
                isMobile ? "text-xs" : "text-[13px]"
              )}>
                Conectado ao WhatsApp
              </span>
            ) : (
              <span className={cn(
                "px-4 py-2 rounded-full bg-red-200/40 dark:bg-red-700/15",
                "text-red-700 dark:text-red-300 font-semibold border-0",
                "tracking-wide",
                isMobile ? "text-xs" : "text-[13px]"
              )}>
                Desconectado
              </span>
            )}
          </div>

          {/* Delete Button */}
          {isDisconnected && (
            <Button
              variant="destructive"
              className={cn(
                "mt-4 w-full font-bold rounded-xl shadow-lg",
                isMobile ? "text-sm" : "text-base"
              )}
              onClick={handleDelete}
            >
              <Trash2 className={cn("mr-2", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              Deletar Instância
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
