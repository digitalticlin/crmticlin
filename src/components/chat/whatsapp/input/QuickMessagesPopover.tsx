
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Plus } from "lucide-react";

interface QuickMessagesPopoverProps {
  onQuickMessage: (message: string) => void;
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

export const QuickMessagesPopover = ({ onQuickMessage }: QuickMessagesPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-600 hover:text-gray-900 hover:bg-white/30 w-12 h-12 rounded-full transition-all duration-200"
          title="Mensagens Rápidas"
        >
          <Zap className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-80 p-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Mensagens Rápidas</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 hover:bg-white/30 h-8 px-3 rounded-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar Nova
            </Button>
          </div>
          
          <ScrollArea className="max-h-64">
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
      </PopoverContent>
    </Popover>
  );
};
