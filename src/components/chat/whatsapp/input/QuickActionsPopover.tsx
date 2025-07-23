
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Paperclip, Image, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { PhotoUploadDialog } from "../media/PhotoUploadDialog";
import { FileUploadDialog } from "../media/FileUploadDialog";

interface QuickActionsPopoverProps {
  onSendMessage?: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

export const QuickActionsPopover = ({ onSendMessage }: QuickActionsPopoverProps) => {
  const isMobile = useIsMobile();
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);

  // Handler padrão se não for fornecido
  const handleSendMessage = onSendMessage || (async () => {
    console.warn('[QuickActionsPopover] onSendMessage não fornecido');
    return false;
  });

  return (
    <>
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
              onClick={() => setPhotoDialogOpen(true)}
            >
              <Image className="h-4 w-4 mr-2" />
              Enviar Fotos
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200"
              onClick={() => setFileDialogOpen(true)}
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

      {/* Dialogs isolados */}
      <PhotoUploadDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        onSendMessage={handleSendMessage}
      />

      <FileUploadDialog
        open={fileDialogOpen}
        onOpenChange={setFileDialogOpen}
        onSendMessage={handleSendMessage}
      />
    </>
  );
};
