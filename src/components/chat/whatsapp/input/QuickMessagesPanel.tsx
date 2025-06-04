
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

interface QuickMessagesPanelProps {
  onQuickMessage: (message: string) => void;
  onClose: () => void;
}

const QUICK_MESSAGES = [
  "Olá! Como posso ajudá-lo?",
  "Obrigado pelo contato!",
  "Vou verificar para você.",
  "Posso ligar para você?",
  "Tem alguma dúvida?",
  "Aguardo seu retorno.",
  "Ótimo! Vamos prosseguir.",
  "Perfeito! Obrigado.",
];

export const QuickMessagesPanel = ({ onQuickMessage, onClose }: QuickMessagesPanelProps) => {
  return (
    <div className="mb-4 p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Mensagens Rápidas</span>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 hover:text-gray-900 hover:bg-white/30 h-8 px-3 rounded-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Criar Nova
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 hover:bg-white/30 h-8 px-2 rounded-xl transition-all duration-200"
          >
            ✕
          </Button>
        </div>
      </div>
      <ScrollArea className="max-h-40">
        <div className="grid gap-2 pr-2">
          {QUICK_MESSAGES.map((quickMsg, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => onQuickMessage(quickMsg)}
              className="justify-start text-left text-gray-700 hover:bg-white/30 hover:text-gray-900 h-auto py-2 px-3 rounded-xl transition-all duration-200 whitespace-normal"
            >
              {quickMsg}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
