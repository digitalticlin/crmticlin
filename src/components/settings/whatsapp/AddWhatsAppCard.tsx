
import { Card } from "@/components/ui/card";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddWhatsAppCardProps {
  isSuperAdmin?: boolean;
  isNewUser: boolean;
  isCreating: boolean;
  onAdd: () => void;
}

const lemonNeon = "#F9FF66";

const AddWhatsAppCard = ({
  isSuperAdmin = false,
  isNewUser,
  isCreating,
  onAdd,
}: AddWhatsAppCardProps) => (
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
      {/* Ícone limão à esquerda, igual ao card de instância */}
      <div className="flex flex-col items-center justify-center h-full px-8 py-5 bg-[#F9FF66]/20 border-r border-white/10">
        <MessageSquare className="w-10 h-10 text-[#F9FF66]" />
      </div>

      {/* Área principal, igual à do card de instância */}
      <div className="flex flex-1 flex-row items-center justify-between px-8 py-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-medium text-white/70 uppercase tracking-wider mb-0.5">
            WhatsApp
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xl font-bold text-white truncate max-w-[240px]">
              Adicionar WhatsApp
            </h4>
          </div>
          <div>
            {!isSuperAdmin && !isNewUser ? (
              <p className="text-sm text-white/60 mt-1">
                Disponível apenas em planos superiores. Atualize seu plano.
              </p>
            ) : isNewUser ? (
              <p className="text-sm text-white/70 mt-1">
                Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
              </p>
            ) : (
              <p className="text-sm text-white/70 mt-1">
                Como SuperAdmin, adicione quantos números quiser.
              </p>
            )}
          </div>
        </div>
        {/* Área do botão alinhada à direita, igual ao card padrão */}
        <div className="flex flex-col gap-2 ml-8">
          <Button
            variant="whatsapp"
            size="sm"
            className="px-5 py-2 text-base font-semibold rounded-lg"
            disabled={(!isSuperAdmin && !isNewUser) || isCreating}
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export default AddWhatsAppCard;
