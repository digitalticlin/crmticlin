
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
const purple = "#9b87f5";
const grayText = "#aaadb0";

const AddWhatsAppCard = ({
  isSuperAdmin = false,
  isNewUser,
  isCreating,
  onAdd,
}: AddWhatsAppCardProps) => (
  <div className="w-full flex justify-center items-center px-2">
    <Card
      className={`
        relative flex flex-col md:flex-row w-full max-w-2xl min-h-[220px] md:min-h-[260px] bg-white/20 dark:bg-card/20
        border-2 border-white/10 dark:border-white/10 rounded-2xl shadow-glass-lg overflow-hidden
        transition-all duration-300 hover:border-[${lemonNeon}] ring-1 ring-white/5
        backdrop-blur-xl glass
      `}
      style={{
        boxShadow: "0 12px 40px 0 rgba(16,20,29,0.20)",
        background: "rgba(255, 255, 255, 0.13)",
      }}
    >
      {/* Ícone flutuando lado esquerdo */}
      <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-transparent z-10 relative">
        <div
          className="flex items-center justify-center rounded-full border-[4px] border-white/20 shadow-xl bg-[#F9FF66]/80"
          style={{
            width: 80,
            height: 80,
            marginTop: 36,
            marginBottom: 32,
            boxShadow:
              "0 2px 24px 0 rgba(249,255,102,0.14), 0 0px 0px -1px #F9FF66",
          }}
        >
          <MessageSquare size={42} className="text-[#1e1e1e] drop-shadow" />
        </div>
      </div>

      {/* Área central de conteúdo */}
      <div className="w-full md:w-2/3 flex flex-col items-center justify-center py-7 px-6 md:px-10 text-center">
        <span
          className="text-xs tracking-widest uppercase font-semibold mb-1"
          style={{ color: grayText, letterSpacing: 2 }}
        >
          WhatsApp
        </span>
        <h2 className="text-[1.6rem] leading-tight font-bold text-neutral-900 dark:text-zinc-50 mb-1">
          Adicione um novo número
        </h2>
        <p className="text-[1rem] text-muted-foreground mb-1 font-medium max-w-md mx-auto">
          {isSuperAdmin
            ? "Como super admin, adicione quantos números quiser para automatizar o atendimento do seu time!"
            : isNewUser
            ? "Bem-vindo! Adicione seu primeiro número do WhatsApp para começar a se comunicar com seus clientes."
            : "Disponível apenas em planos superiores. Atualize seu plano para adicionar mais números."}
        </p>
        <Button
          variant="ghost"
          size="lg"
          className={`
            mt-5 px-8 py-4 text-base font-semibold rounded-xl text-white
            bg-[${purple}] hover:bg-[#7e69ab] shadow-lg transition-all duration-200 hover:scale-105
            disabled:bg-zinc-300/70 disabled:text-zinc-400
          `}
          style={{
            background: purple,
            marginTop: "1.2rem",
          }}
          disabled={(!isSuperAdmin && !isNewUser) || isCreating}
          onClick={onAdd}
        >
          <Plus className="w-6 h-6 mr-2" />
          {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
        </Button>
      </div>
    </Card>
  </div>
);

export default AddWhatsAppCard;

