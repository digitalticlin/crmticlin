
import { cn } from "@/lib/utils";
import { Palette } from "lucide-react";

interface TagColorSelectorProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export const TagColorSelector = ({ selectedColor, onSelectColor }: TagColorSelectorProps) => {
  const availableColors = [
    "bg-blue-400", 
    "bg-red-400", 
    "bg-green-400", 
    "bg-purple-400", 
    "bg-yellow-400", 
    "bg-amber-400", 
    "bg-emerald-400", 
    "bg-pink-400", 
    "bg-indigo-400", 
    "bg-teal-400", 
    "bg-orange-400", 
    "bg-cyan-400"
  ];
  
  return (
    <div>
      <h5 className="text-xs font-medium mb-1.5 flex items-center">
        <Palette className="h-3 w-3 mr-1" />
        Cor
      </h5>
      <div className="flex flex-wrap gap-1.5">
        {availableColors.map((color) => (
          <div
            key={color}
            className={cn(
              "w-5 h-5 rounded-full cursor-pointer",
              color,
              selectedColor === color && "ring-2 ring-offset-1 ring-black/50"
            )}
            onClick={() => onSelectColor(color)}
          />
        ))}
      </div>
    </div>
  );
};
