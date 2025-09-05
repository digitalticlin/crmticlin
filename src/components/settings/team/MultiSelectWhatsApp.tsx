
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

interface MultiSelectWhatsAppProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  allWhatsApps: { id: string; instance_name: string }[];
}

export function MultiSelectWhatsApp({
  selectedIds,
  onSelectionChange,
  allWhatsApps,
}: MultiSelectWhatsAppProps) {
  // Garantir que os arrays nunca sejam undefined
  const safeWhatsApps = allWhatsApps || [];
  const safeSelectedIds = selectedIds || [];
  
  console.log('[MultiSelectWhatsApp] ===== RENDER =====');
  console.log('[MultiSelectWhatsApp] selectedIds recebido:', selectedIds);
  console.log('[MultiSelectWhatsApp] allWhatsApps recebido:', allWhatsApps);
  console.log('[MultiSelectWhatsApp] safeWhatsApps (length):', safeWhatsApps.length);
  console.log('[MultiSelectWhatsApp] safeSelectedIds:', safeSelectedIds);

  const handleSelect = (id: string) => {
    console.log('[MultiSelectWhatsApp] ===== SELECIONANDO WHATSAPP =====');
    console.log('[MultiSelectWhatsApp] ID selecionado:', id);
    console.log('[MultiSelectWhatsApp] IDs atuais:', safeSelectedIds);
    
    if (!safeSelectedIds.includes(id)) {
      const newIds = [...safeSelectedIds, id];
      console.log('[MultiSelectWhatsApp] Novos IDs após adição:', newIds);
      onSelectionChange(newIds);
    } else {
      console.log('[MultiSelectWhatsApp] ID já está selecionado, ignorando');
    }
  };

  const handleRemove = (id: string) => {
    console.log('[MultiSelectWhatsApp] ===== REMOVENDO WHATSAPP =====');
    console.log('[MultiSelectWhatsApp] ID para remover:', id);
    console.log('[MultiSelectWhatsApp] IDs antes da remoção:', safeSelectedIds);
    
    const newIds = safeSelectedIds.filter((wId) => wId !== id);
    console.log('[MultiSelectWhatsApp] Novos IDs após remoção:', newIds);
    onSelectionChange(newIds);
  };

  return (
    <div>
      <Label className="block mb-1 text-white">Instâncias WhatsApp permitidas</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {safeSelectedIds.map(id => {
          const option = safeWhatsApps.find(w => w.id === id);
          if (!option) return null;
          return (
            <Badge
              key={id}
              className="bg-white/40 border border-white/40 text-black flex items-center px-2 py-1 gap-1"
            >
              {option.instance_name}
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
          <SelectValue placeholder="Selecionar instância" />
        </SelectTrigger>
        <SelectContent className="glass-morphism bg-white/40 border-white/20 text-black z-50">
          {safeWhatsApps
            .filter(w => !safeSelectedIds.includes(w.id))
            .map(w => (
              <SelectItem
                key={w.id}
                value={w.id}
                className="text-black"
              >
                {w.instance_name}
              </SelectItem>
            ))}
          {safeWhatsApps.length === 0 && (
            <SelectItem value="none" disabled className="text-black">Nenhuma disponível</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
