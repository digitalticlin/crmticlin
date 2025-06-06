
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Edit, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface PurchaseValueSectionProps {
  client: ClientData;
  onUpdatePurchaseValue: (value: number | undefined) => void;
}

export function PurchaseValueSection({ client, onUpdatePurchaseValue }: PurchaseValueSectionProps) {
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [purchaseValue, setPurchaseValue] = useState(client.purchase_value?.toString() || "");

  const handleSaveValue = () => {
    const value = purchaseValue ? parseFloat(purchaseValue) : undefined;
    onUpdatePurchaseValue(value);
    setIsEditingValue(false);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "Não informado";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <DollarSign className="h-5 w-5 text-[#d3d800]" />
        <h3 className="text-lg font-semibold text-white">Valor de Compra</h3>
      </div>
      
      <div className="space-y-4">
        {isEditingValue ? (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-white/90">Valor</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveValue}
                className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
              >
                <Save className="h-3 w-3 mr-1" />
                Salvar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsEditingValue(false);
                  setPurchaseValue(client.purchase_value?.toString() || "");
                }}
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-white/90">Valor</Label>
              <p className="text-xl font-semibold text-white">{formatCurrency(client.purchase_value)}</p>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setIsEditingValue(true)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
