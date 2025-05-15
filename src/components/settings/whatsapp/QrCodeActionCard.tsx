
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { X, RefreshCcw, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppSupportErrorModal } from "./WhatsAppSupportErrorModal";

interface QrCodeActionCardProps {
  qrCodeUrl: string;
  isLoading?: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  instanceName?: string | null;
  onCloseWithRefresh?: () => void; // NOVO: ao fechar, dispara atualização (refetch)
}

const EVOLUTION_API = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

const QrCodeActionCard = ({
  qrCodeUrl,
  isLoading = false,
  onScanned,
  onRegenerate,
  onCancel,
  instanceName,
  onCloseWithRefresh // NOVO!
}: QrCodeActionCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qrUrl, setQrUrl] = useState(qrCodeUrl);

  // Novo: controle do modal de suporte
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportDetail, setSupportDetail] = useState<string | undefined>(undefined);

  // --- Função util para finalizar (fecha e atualiza) ---
  const handleCloseAll = () => {
    onCancel();
    if (onCloseWithRefresh) onCloseWithRefresh();
  };

  // Novo handler para cancelar e deletar a instância na Evolution API
  const handleDeleteInstance = async () => {
    if (!instanceName) {
      handleCloseAll();
      return;
    }
    setIsDeleting(true);
    try {
      const { evolutionApiService } = await import("@/services/evolution-api");
      // Executa o DELETE e captura a resposta
      const response = await fetch(
        `https://ticlin-evolution-api.eirfpl.easypanel.host/instance/delete/${encodeURIComponent(instanceName)}`,
        {
          method: "DELETE",
          headers: {
            "apikey": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
            "Content-Type": "application/json",
          },
        }
      );

      let json: any = null;
      try {
        json = await response.json();
      } catch {
        // resposta não é json válida, erro inesperado
        throw new Error("Resposta inesperada do servidor");
      }

      // Trata o caso de sucesso ("SUCESS")
      if (
        (typeof json.status === "string" && json.status.toLowerCase().includes("succes")) ||
        (json.status === 200 && json.error === false)
      ) {
        toast({
          title: "Instância cancelada com sucesso!",
          variant: "default",
        });
        handleCloseAll();
        return;
      }

      // Trata caso "instance does not exist" (404)
      if (
        (json?.status === 404 || json?.status === "404") &&
        json?.response?.message &&
        Array.isArray(json.response.message) &&
        json.response.message.join(" ").toLowerCase().includes("instance does not exist")
      ) {
        // Considera como sucesso silencioso: apenas fecha modal
        handleCloseAll();
        return;
      }

      // Outros erros: mostra erro detalhado
      throw new Error(json?.response?.message?.join(" ") || json?.error || "Erro ao cancelar instância");
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar instância",
        description: error?.message || "",
        variant: "destructive",
      });
      handleCloseAll(); // fecha modal mesmo que haja erro
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler para "Já conectei" NOVO FLUXO
  const handleCheckConnected = async () => {
    if (!instanceName) return;
    setIsChecking(true);

    // Helper para analisar o resultado, inclusive "404"
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${EVOLUTION_API}/instance/connectionState/${instanceName}`, {
          method: "GET",
          headers: {
            "apikey": API_KEY,
            "Content-Type": "application/json"
          }
        });

        // Tentar extrair status numérico, response json
        let json, statusCode = res.status;
        try {
          json = await res.json();
        } catch {
          throw new Error("Erro ao decodificar resposta JSON");
        }

        // Trata instância não existe (404)
        if (
          statusCode === 404 ||
          (json?.status === 404 && json?.response?.message?.join(" ").toLowerCase().includes("instance does not exist"))
        ) {
          setSupportDetail((json?.response?.message?.join(" ") || "Instância não encontrada."));
          setShowSupportModal(true);
          setIsChecking(false);
          return { type: "not-exist" };
        }

        // Se houver .instance.state ou .state
        const state = json?.instance?.state || json?.state;
        if (!state) throw new Error("Resposta de status inesperada da Evolution API");

        return { type: "state", value: state, full: json };
      } catch (error: any) {
        setSupportDetail(error.message || "Erro ao consultar status.");
        setShowSupportModal(true);
        setIsChecking(false);
        return { type: "error" };
      }
    };

    // Primeira requisição
    const result = await fetchStatus();
    if (!result || result.type !== "state") {
      // Abre o modal de suporte se erro ou não existe
      setIsChecking(false);
      return;
    }

    if (result.value === "open") {
      // Instância conectada com sucesso!
      onScanned(); // fecha modal/modal QR
      toast({
        title: "Instância conectada!",
        description: "Seu WhatsApp foi conectado com sucesso.",
      });
      setIsChecking(false);
      if (onCloseWithRefresh) onCloseWithRefresh();
      return;
    }

    if (result.value === "connecting") {
      // Espera 10s e tenta mais uma vez (apenas 1x)
      setTimeout(async () => {
        const secondResult = await fetchStatus();
        if (secondResult && secondResult.type === "state" && secondResult.value === "open") {
          onScanned();
          toast({
            title: "Instância conectada!",
            description: "Seu WhatsApp foi conectado.",
          });
        } else if (secondResult && secondResult.type === "state" && secondResult.value === "closed") {
          toast({
            title: "Instância removida.",
            description: "Esse número foi excluído e deve ser reconectado.",
            variant: "destructive"
          });
        } else if (secondResult && secondResult.type === "not-exist") {
          setSupportDetail((secondResult.full?.response?.message?.join(" ") || "Instância não encontrada."));
          setShowSupportModal(true);
        } else {
          // Se ainda connecting, apenas aceita estado e não faz mais polling
          toast({
            title: "Ainda aguardando conexão.",
            description: "Tente novamente em instantes, ou leia QR code novamente se necessário.",
            variant: "default"
          });
        }
        setIsChecking(false);
        if (onCloseWithRefresh) onCloseWithRefresh();
      }, 10000); // 10 segundos
      return;
    }

    if (result.value === "closed") {
      toast({
        title: "Instância removida.",
        description: "Esse número foi excluído e deve ser reconectado.",
        variant: "destructive"
      });
      setIsChecking(false);
      if (onCloseWithRefresh) onCloseWithRefresh();
      return;
    }

    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <Card className="w-full max-w-lg glass-morphism p-8 rounded-2xl shadow-2xl border-none transition-all">
        <CardHeader className="flex flex-col items-center text-center pb-2 border-none bg-transparent">
          <CardTitle className="text-lg font-semibold mb-0 text-gradient">
            Escaneie para conectar seu WhatsApp
          </CardTitle>
          <CardDescription className="mt-2 mb-0 text-xs text-muted-foreground max-w-xs">
            Use a câmera do celular para acessar:<br />
            <span className="font-medium">Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-0 pb-2 pt-1">
          <div className="flex justify-center items-center bg-white/15 dark:bg-zinc-700 rounded-xl p-3 mb-4 w-72 h-72 sm:w-80 sm:h-80 shadow-xl border border-white/20 backdrop-blur-md transition-all">
            <img
              src={qrUrl}
              alt="QR Code para conexão do WhatsApp"
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg border-2 border-green-400 shadow-lg"
              draggable={false}
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center pb-2">
            O QR code expira em poucos minutos.<br /> Gere novamente se necessário.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0 px-0 border-none bg-transparent">
          <div className="flex flex-col sm:flex-row gap-2 w-full px-0 justify-between items-stretch">
            <Button
              variant="default"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleCheckConnected}
              disabled={isLoading || isDeleting || isChecking || isRefreshing}
            >
              {isChecking ? <span className="animate-spin"><Check className="w-4 h-4 mr-1" /></span> : <Check className="w-4 h-4 mr-1" />}
              Já conectei
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleDeleteInstance}
              disabled={isLoading || isDeleting || isChecking || isRefreshing}
            >
              {isDeleting ? <span className="animate-spin"><X className="w-4 h-4 mr-1" /></span> : <X className="w-4 h-4 mr-1" />}
              {isDeleting ? "Cancelando..." : "Cancelar"}
            </Button>
          </div>
        </CardFooter>
      </Card>
      {/* SUPORTE: Modal para instance not exist */}
      <WhatsAppSupportErrorModal
        open={showSupportModal}
        errorDetail={supportDetail}
        onClose={() => setShowSupportModal(false)}
      />
      {/* Glassmorphism utility */}
      <style>{`
        .glass-morphism {
          background: rgba(255,255,255,0.17);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(13px);
          -webkit-backdrop-filter: blur(13px);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255, 0.18);
          transition: all 0.2s;
        }
        .text-gradient {
          background: linear-gradient(90deg, #19ffe5 8%, #a685ff 44%, #7e30e1 86%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
      `}
      </style>
    </div>
  );
};

export default QrCodeActionCard;
