
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
    <Card className="overflow-hidden glass-card border-0 mb-4 bg-white/10 dark:bg-black/10 backdrop-blur-md shadow-md">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-medium">WhatsApp</h4>
              <p className="text-sm text-muted-foreground">
                Instance: {instanceName}
              </p>
              {isConnected && phoneNumber && (
                <div className="flex items-center mt-1 gap-1 text-green-600 dark:text-green-400">
                  <span className="font-mono text-xs">{phoneNumber}</span>
                </div>
              )}
            </div>
            <div>
              {isConnected ? (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold">
                  Conectado
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 rounded-lg text-xs font-semibold">
                  Disconnected
                </span>
              )}
            </div>
          </div>
          <div>
            {isConnected && (
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-900/40 p-3 mb-2 text-center">
                <div>
                  <span className="font-medium">Instância:</span> {instanceName}
                </div>
                {phoneNumber && (
                  <div>
                    <span className="font-medium">Telefone:</span> {phoneNumber}
                  </div>
                )}
              </div>
            )}
            {isDisconnected && (
              <div className="mb-2 py-2 text-center">
                <span className="text-red-700 font-semibold">Dispositivo desconectado</span>
              </div>
            )}
            {isDisconnected && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 w-4 h-4" />
                Deletar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
