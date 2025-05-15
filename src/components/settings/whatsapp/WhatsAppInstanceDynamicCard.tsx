import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface WhatsAppInstanceDynamicCardProps {
  instance: {
    id: string
    instanceName: string
    phoneNumber?: string
    status: "connected" | "connecting" | "disconnected" // status direto do Supabase
  }
  onDeleteSuccess: (id: string) => void
}

const EVOLUTION_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host"
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t"

export default function WhatsAppInstanceDynamicCard({ instance, onDeleteSuccess }: WhatsAppInstanceDynamicCardProps) {
  const { id, instanceName, phoneNumber, status } = instance
  const isConnected = status === "connected" || status === "connecting"
  const isDisconnected = status === "disconnected"

  // Botão de deletar
  const handleDelete = async () => {
    try {
      const resp = await fetch(
        `${EVOLUTION_URL}/instance/delete/${encodeURIComponent(instanceName)}`,
        {
          method: "DELETE",
          headers: {
            "apikey": API_KEY
          }
        }
      )
      const data = await resp.json()
      if (!resp.ok || data?.status !== "SUCCESS") {
        throw new Error(data?.response?.message || "Erro ao deletar instância na Evolution API")
      }
      toast.success("Instância removida com sucesso!")
      onDeleteSuccess(id)
    } catch (e: any) {
      toast.error(e?.message || "Erro ao deletar instância")
    }
  }

  return (
    <Card className="overflow-hidden glass-card border-0 mb-6 bg-white/10 dark:bg-black/20 backdrop-blur-lg shadow-glass relative transition-shadow duration-300 animate-fade-in">
      <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-white/10 dark:from-white/10 dark:to-black/10" />
      <CardContent className="p-0 relative z-10">
        <div className="p-6 flex flex-col items-center">
          <div className="flex justify-between w-full items-center mb-4">
            <div>
              <h4 className="font-semibold text-lg text-white/90 dark:text-white">
                WhatsApp Instance
              </h4>
              <p className="text-sm text-white/60 dark:text-white/60">
                Nome: <span className="font-mono text-xs">{instanceName}</span>
              </p>
            </div>
            <div>
              {isConnected ? (
                <span className="px-3 py-1 bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold shadow-sm border border-white/30">
                  Conectado
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100/60 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-white/30 shadow-sm">
                  Desconectado
                </span>
              )}
            </div>
          </div>
          {isConnected && (
            <div className="w-full mb-3">
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100/40 dark:border-gray-400/10 bg-white/20 dark:bg-black/10 p-4 shadow-inner backdrop-blur-md">
                <span className="font-semibold text-gray-800 dark:text-white/90 mb-1">
                  <span className="text-ticlin mr-1">✓</span> Instância conectada ao WhatsApp
                </span>
                <div className="text-xs text-white/70 dark:text-white/50">
                  <span className="block"><span className="font-medium">Nome:</span> {instanceName}</span>
                  {phoneNumber && (
                    <span className="block mt-1">
                      <span className="font-medium">Telefone:</span> {phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {isDisconnected && (
            <>
              <div className="w-full py-4 text-center mb-2 rounded-xl bg-red-50/40 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                <span className="text-red-700 dark:text-red-400 font-semibold text-base">Dispositivo desconectado</span>
              </div>
              <Button
                variant="destructive"
                className="w-full mt-1 shadow-lg shadow-red-200/30 dark:shadow-red-900/10"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 w-4 h-4" />
                Deletar Instância
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
