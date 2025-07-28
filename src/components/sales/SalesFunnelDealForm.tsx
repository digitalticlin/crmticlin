
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Deal } from '@/types/chat';

interface SalesFunnelDealFormProps {
  deal?: Deal | null;
  onCreate: (deal: Omit<Deal, 'id'>) => void;
  onUpdate: (dealId: string, deal: Partial<Deal>) => void;
  onClose: () => void;
}

export const SalesFunnelDealForm: React.FC<SalesFunnelDealFormProps> = ({
  deal,
  onCreate,
  onUpdate,
  onClose
}) => {
  const [status, setStatus] = useState<"won" | "lost">(deal?.status || 'won');
  const [value, setValue] = useState(deal?.value || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deal) {
      onUpdate(deal.id, { status, value });
    } else {
      onCreate({ status, value });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(value: "won" | "lost") => setStatus(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="won">Ganho</SelectItem>
            <SelectItem value="lost">Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <Input
          id="value"
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          placeholder="Valor da negociação"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {deal ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};
