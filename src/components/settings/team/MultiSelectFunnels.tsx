
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
  // Garantir que os arrays nunca sejam undefined
  const safeFunnels = allFunnels || [];
  const safeSelectedIds = selectedIds || [];
  
  console.log('[MultiSelectFunnels] ===== RENDER =====');
  console.log('[MultiSelectFunnels] selectedIds recebido:', selectedIds);
  console.log('[MultiSelectFunnels] allFunnels recebido:', allFunnels);
  console.log('[MultiSelectFunnels] safeFunnels (length):', safeFunnels.length);
  console.log('[MultiSelectFunnels] safeSelectedIds:', safeSelectedIds);

  const handleSelect = (id: string) => {
    console.log('[MultiSelectFunnels] ===== SELECIONANDO FUNIL =====');
    console.log('[MultiSelectFunnels] ID selecionado:', id);
    console.log('[MultiSelectFunnels] IDs atuais:', safeSelectedIds);
    
    if (!safeSelectedIds.includes(id)) {
      const newIds = [...safeSelectedIds, id];
      console.log('[MultiSelectFunnels] Novos IDs após adição:', newIds);
      onSelectionChange(newIds);
    } else {
      console.log('[MultiSelectFunnels] ID já está selecionado, ignorando');
    }
  };

  const handleRemove = (id: string) => {
    console.log('[MultiSelectFunnels] ===== REMOVENDO FUNIL =====');
    console.log('[MultiSelectFunnels] ID para remover:', id);
    console.log('[MultiSelectFunnels] IDs antes da remoção:', safeSelectedIds);
    
    const newIds = safeSelectedIds.filter((fId) => fId !== id);
    console.log('[MultiSelectFunnels] Novos IDs após remoção:', newIds);
    onSelectionChange(newIds);
  };

  return (
    <div>
      <Label className="block mb-1 text-white">Funis permitidos</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {safeSelectedIds.map(id => {
          const option = safeFunnels.find(f => f.id === id);
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
          {safeFunnels
            .filter(f => !safeSelectedIds.includes(f.id))
            .map(f => (
              <SelectItem
                key={f.id}
                value={f.id}
                className="text-black"
              >
                {f.name}
              </SelectItem>
            ))}
          {safeFunnels.length === 0 && (
            <SelectItem value="none" disabled className="text-black">Nenhum disponível</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
