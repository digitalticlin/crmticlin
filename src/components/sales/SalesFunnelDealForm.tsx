
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [status, setStatus] = useState(deal?.status || 'pending');
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
        <Input
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Status da negociação"
        />
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
