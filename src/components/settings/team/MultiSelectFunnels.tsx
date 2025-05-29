
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";

interface MultiSelectFunnelsProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  allFunnels: { id: string; name: string }[];
}

export function MultiSelectFunnels({
  selectedIds,
  onSelectionChange,
  allFunnels,
}: MultiSelectFunnelsProps) {
  const handleSelect = (id: string) => {
    if (!selectedIds.includes(id)) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleRemove = (id: string) => {
    onSelectionChange(selectedIds.filter((fId) => fId !== id));
  };

  return (
    <div>
      <Label className="block mb-1 text-white">Funis permitidos</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedIds.map(id => {
          const option = allFunnels.find(f => f.id === id);
          if (!option) return null;
          return (
            <Badge
              key={id}
              className="bg-white/40 border border-white/40 text-black flex items-center px-2 py-1 gap-1"
            >
              {option.name}
              <X
                onClick={() => handleRemove(id)}
                className="cursor-pointer ml-1 h-4 w-4"
              />
            </Badge>
          );
        })}
      </div>
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="bg-white/20 border-white/30 text-white w-full">
          <SelectValue placeholder="Selecionar funil" />
        </SelectTrigger>
        <SelectContent className="glass-morphism bg-white/40 border-white/20 text-black z-50">
          {allFunnels
            .filter(f => !selectedIds.includes(f.id))
            .map(f => (
              <SelectItem
                key={f.id}
                value={f.id}
                className="text-black"
              >
                {f.name}
              </SelectItem>
            ))}
          {allFunnels.length === 0 && (
            <SelectItem value="none" disabled className="text-black">Nenhum disponível</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
