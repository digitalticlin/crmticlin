
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  ImageIcon, 
  FileIcon, 
  VideoIcon, 
  MicIcon,
  MapPinIcon,
  SmileIcon,
  PhoneIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsPopoverProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  onOpenPhotoDialog?: () => void;
  onOpenFileDialog?: () => void;
}

export const QuickActionsPopover: React.FC<QuickActionsPopoverProps> = ({
  onSendMessage,
  onOpenPhotoDialog,
  onOpenFileDialog
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
        
      case 'file':
        if (onOpenFileDialog) {
          onOpenFileDialog();
        }
        break;
        
      case 'location':
        await onSendMessage('📍 Localização compartilhada');
        break;
        
      case 'contact':
        await onSendMessage('👤 Contato compartilhado');
        break;
        
      default:
        console.log(`Ação não implementada: ${action}`);
    }
  };

  const quickActions = [
    {
      id: 'photo',
      label: 'Foto',
      icon: ImageIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'file',
      label: 'Arquivo',
      icon: FileIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'video',
      label: 'Vídeo',
      icon: VideoIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'audio',
      label: 'Áudio',
      icon: MicIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'location',
      label: 'Localização',
      icon: MapPinIcon,
      color: 'text-red-500',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      id: 'contact',
      label: 'Contato',
      icon: PhoneIcon,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
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
            "text-gray-600 hover:text-green-600 hover:bg-green-50",
            "border border-transparent hover:border-green-200"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-72 p-3" 
        align="start"
        side="top"
      >
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.id}
                variant="ghost"
                onClick={() => handleAction(action.id)}
                className={cn(
                  "h-16 flex-col gap-1 p-2 rounded-lg transition-all duration-200",
                  action.bgColor,
                  "hover:scale-105 hover:shadow-md"
                )}
              >
                <Icon className={cn("h-5 w-5", action.color)} />
                <span className="text-xs font-medium text-gray-700">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Clique para enviar mídia ou informações
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
