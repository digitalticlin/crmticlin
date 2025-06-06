
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SidebarHeaderProps {
  onClose: () => void;
}

export const SidebarHeader = ({ onClose }: SidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10 backdrop-blur-sm">
      <h2 className="text-xl font-semibold text-gray-800">Detalhes do Lead</h2>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose} 
        className="text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-full"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
