
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Paperclip, Image, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuickActionsPopoverProps {
  // Remove onToggleQuickMessages - agora é um componente separado
}

export const QuickActionsPopover = ({}: QuickActionsPopoverProps) => {
  const isMobile = useIsMobile();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-600 hover:text-gray-900 hover:bg-white/30 w-12 h-12 rounded-full transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-56 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl"
      >
        <div className="grid gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200"
          >
            <Image className="h-4 w-4 mr-2" />
            Enviar Fotos
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Enviar Arquivos
          </Button>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200"
            >
              <Camera className="h-4 w-4 mr-2" />
              Câmera
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
