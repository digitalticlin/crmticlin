
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="mb-4 p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Mensagens Rápidas</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 hover:bg-white/20 h-6 px-2 rounded-lg"
        >
          ✕
        </Button>
      </div>
      <ScrollArea className="max-h-32">
        <div className="grid gap-2">
          {QUICK_MESSAGES.map((quickMsg, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => onQuickMessage(quickMsg)}
              className="justify-start text-left text-gray-700 hover:bg-white/30 hover:text-gray-900 h-8 px-3 rounded-lg transition-colors"
            >
              {quickMsg}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
