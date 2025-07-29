
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  ImageIcon, 
  FileIcon, 
  VideoIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsPopoverProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  onOpenPhotoDialog?: () => void;
  onOpenFileDialog?: () => void;
  onOpenVideoDialog?: () => void;
}

export const QuickActionsPopover: React.FC<QuickActionsPopoverProps> = ({
  onSendMessage,
  onOpenPhotoDialog,
  onOpenFileDialog,
  onOpenVideoDialog
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (action: string) => {
    setIsOpen(false);
    
    switch (action) {
      case 'photo':
        if (onOpenPhotoDialog) {
          onOpenPhotoDialog();
        }
        break;
        
      case 'video':
        if (onOpenVideoDialog) {
          onOpenVideoDialog();
        }
        break;
        
      case 'file':
        if (onOpenFileDialog) {
          onOpenFileDialog();
        }
        break;
        
      default:
        console.log(`Ação não implementada: ${action}`);
    }
  };

  // ✅ APENAS 3 AÇÕES DE MÍDIA: Foto, Vídeo, Arquivo
  const quickActions = [
    {
      id: 'photo',
      label: 'Foto',
      icon: ImageIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50/80 hover:bg-blue-100/90 backdrop-blur-sm border-blue-200/30'
    },
    {
      id: 'video',
      label: 'Vídeo',
      icon: VideoIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50/80 hover:bg-purple-100/90 backdrop-blur-sm border-purple-200/30'
    },
    {
      id: 'file',
      label: 'Arquivo',
      icon: FileIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50/80 hover:bg-green-100/90 backdrop-blur-sm border-green-200/30'
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-[44px] w-[44px] rounded-full p-0 transition-all duration-200",
            "text-gray-600 hover:text-green-600",
            "bg-white/20 hover:bg-white/30 backdrop-blur-sm",
            "border border-white/20 hover:border-green-200/50",
            "shadow-sm hover:shadow-md"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className={cn(
          "w-64 p-3",
          "bg-white/95 backdrop-blur-md border border-white/30",
          "shadow-xl rounded-2xl",
          "backdrop-saturate-150"
        )}
        align="start"
        side="top"
      >
        {/* ✅ GRID 3x1 PARA APENAS 3 MÍDIAS */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.id}
                variant="ghost"
                onClick={() => handleAction(action.id)}
                className={cn(
                  "h-20 flex-col gap-2 p-3 rounded-xl transition-all duration-200",
                  action.bgColor,
                  "hover:scale-105 hover:shadow-lg border",
                  "group"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6 transition-transform duration-200 group-hover:scale-110", 
                  action.color
                )} />
                <span className="text-xs font-medium text-gray-700">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100/50">
          <p className="text-xs text-gray-500/80 text-center">
            Selecione o tipo de mídia para enviar
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
