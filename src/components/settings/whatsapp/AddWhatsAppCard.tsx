
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
        flex flex-row items-center w-full max-w-2xl min-w-[350px] min-h-[150px] p-0 bg-white/10 dark:bg-card/10 border-2 border-white/10 dark:border-white/10 rounded-2xl shadow-glass-lg overflow-hidden transition-colors duration-300 hover:border-[${lemonNeon}] ring-1 ring-white/5
      `}
      style={{ boxShadow: "0 8px 40px 0 rgba(16,20,29,0.20)" }}
    >
      {/* Ícone limão à esquerda */}
      <div className="flex flex-col items-center justify-center h-full px-10 py-8 bg-[#F9FF66]/20 border-r border-white/10 min-h-full">
        <MessageSquare className="w-12 h-12 text-[#F9FF66]" />
      </div>

      {/* Área principal */}
      <div className="flex flex-1 flex-row items-center justify-between px-10 py-8 min-h-full overflow-x-auto">
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
            WhatsApp
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-2xl font-bold text-white truncate max-w-[320px]">
              Adicionar WhatsApp
            </h4>
          </div>
          <div>
            {!isSuperAdmin && !isNewUser ? (
              <p className="text-sm text-white/60 mt-2">
                Disponível apenas em planos superiores. Atualize seu plano.
              </p>
            ) : isNewUser ? (
              <p className="text-sm text-white/70 mt-2">
                Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
              </p>
            ) : (
              <p className="text-sm text-white/70 mt-2">
                Como SuperAdmin, adicione quantos números quiser.
              </p>
            )}
          </div>
        </div>
        {/* Botão alinhado à direita */}
        <div className="flex flex-col gap-2 ml-8">
          <Button
            variant="whatsapp"
            size="sm"
            className="px-6 py-3 text-lg font-semibold rounded-lg"
            disabled={(!isSuperAdmin && !isNewUser) || isCreating}
            onClick={onAdd}
          >
            <Plus className="w-5 h-5 mr-2" />
            {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export default AddWhatsAppCard;
