
import { Button } from "@/components/ui/button";
import { Bot, Plus, Sparkles } from "lucide-react";

interface AIAgentEmptyStateProps {
  onCreateAgent: () => void;
}

export const AIAgentEmptyState = ({ onCreateAgent }: AIAgentEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Ícone ilustrativo */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-ticlin/20 blur-3xl rounded-full"></div>
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-ticlin/30 to-ticlin/10 border-2 border-ticlin/40 flex items-center justify-center">
          <Bot className="h-12 w-12 text-ticlin/70" />
          <Sparkles className="h-5 w-5 text-ticlin absolute -top-1 -right-1 animate-pulse" />
        </div>
      </div>

      {/* Título e Descrição */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
        Nenhum agente de IA configurado
      </h3>
      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
        Crie seu primeiro agente inteligente para automatizar atendimentos, vendas e suporte no WhatsApp.
      </p>

      {/* CTA */}
      <Button
        onClick={onCreateAgent}
        className="bg-ticlin hover:bg-ticlin/90 text-black font-medium shadow-lg hover:shadow-xl transition-all"
      >
        <Plus className="h-4 w-4 mr-2" />
        Criar Meu Primeiro Agente
      </Button>

      {/* Dicas rápidas */}
      <div className="mt-8 p-4 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50 max-w-md">
        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ticlin" />
          Dica rápida:
        </h4>
        <ul className="text-xs text-gray-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-ticlin font-bold">1.</span>
            <span>Escolha o tipo de agente (Atendimento, Vendas, Suporte ou Custom)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ticlin font-bold">2.</span>
            <span>Configure a personalidade e objetivos do agente</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ticlin font-bold">3.</span>
            <span>Crie o fluxo de conversação no Flow Builder</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ticlin font-bold">4.</span>
            <span>Conecte a um número de WhatsApp e ative!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
