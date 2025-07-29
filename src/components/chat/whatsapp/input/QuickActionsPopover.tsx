
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paperclip, Image, File, Mic, Video } from "lucide-react";
import { toast } from "sonner";

interface QuickActionsPopoverProps {
  onSendMessage: (message: string) => Promise<boolean>;
}

export const QuickActionsPopover = ({ onSendMessage }: QuickActionsPopoverProps) => {
  const [open, setOpen] = useState(false);

  const handleFileUpload = (type: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    switch (type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'video':
        input.accept = 'video/*';
        break;
      case 'audio':
        input.accept = 'audio/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.zip,.rar';
        break;
    }
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Por enquanto, apenas mostra toast indicando que a funcionalidade será implementada
        toast.info(`Funcionalidade de ${type} será implementada em breve`);
      }
    };
    
    input.click();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 h-[44px] w-[44px] rounded-full">
          <Paperclip className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="start">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => handleFileUpload('image')}
          >
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => handleFileUpload('video')}
          >
            <Video className="h-4 w-4 mr-2" />
            Vídeo
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => handleFileUpload('audio')}
          >
            <Mic className="h-4 w-4 mr-2" />
            Áudio
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => handleFileUpload('document')}
          >
            <File className="h-4 w-4 mr-2" />
            Documento
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
