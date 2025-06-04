
import React from "react";
import { DragHandleProps } from "react-beautiful-dnd";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GripVertical } from "lucide-react";

interface DraggableItemProps {
  ref: React.Ref<HTMLDivElement>;
  dragHandleProps: DragHandleProps | null;
  isDragging: boolean;
  isEnabled: boolean;
  label: string;
  onToggle: () => void;
}

export const DraggableItem = React.forwardRef<HTMLDivElement, DraggableItemProps>(
  ({ dragHandleProps, isDragging, isEnabled, label, onToggle, ...props }, ref) => {
    console.log(`DraggableItem [${label}] - enabled: ${isEnabled}, dragging: ${isDragging}`);
    
    const handleToggleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Toggle clicked: ${label} - changing from ${isEnabled} to ${!isEnabled}`);
      onToggle();
    };
    
    return (
      <div
        ref={ref}
        {...props}
        className={`group relative transition-all duration-300 ${isDragging ? 'z-50 scale-105' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#D3D800]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        
        <div className={`
          relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
          ${isDragging 
            ? 'bg-white/30 border-[#D3D800]/50 shadow-2xl' 
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#D3D800]/30'
          }
        `}>
          <div className="flex items-center gap-3">
            <div
              {...dragHandleProps}
              className="p-1 rounded-lg hover:bg-white/20 transition-all duration-300 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 text-white/60 hover:text-[#D3D800] transition-colors" />
            </div>
            
            <Label className={`
              text-base font-medium cursor-pointer transition-colors duration-300
              ${isEnabled ? 'text-white group-hover:text-[#D3D800]' : 'text-white/50'}
            `}>
              {label}
            </Label>
          </div>
          
          <button
            type="button"
            onClick={handleToggleClick}
            className={`
              p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95
              ${isEnabled ? 'hover:bg-[#D3D800]/20' : 'hover:bg-white/20'}
            `}
          >
            {isEnabled ? (
              <Eye className="w-6 h-6 text-[#D3D800] drop-shadow-lg" />
            ) : (
              <EyeOff className="w-6 h-6 text-white/40 hover:text-white/60 transition-colors" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

DraggableItem.displayName = "DraggableItem";
