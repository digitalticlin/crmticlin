
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Paperclip } from "lucide-react";

interface QuickActionsPopoverProps {
  onToggleQuickMessages: () => void;
}

export const QuickActionsPopover = ({ onToggleQuickMessages }: QuickActionsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-600 hover:text-gray-900 hover:bg-white/20 w-12 h-12 rounded-full transition-colors"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-56 p-3 bg-white/90 backdrop-blur-md border-white/30 shadow-xl">
        <div className="grid gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleQuickMessages}
            className="justify-start text-gray-700 hover:bg-white/50"
          >
            💬 Mensagens Rápidas
          </Button>
          <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:bg-white/50">
            <Paperclip className="h-4 w-4 mr-2" />
            Anexar Arquivo
          </Button>
          <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:bg-white/50">
            📷 Câmera
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
