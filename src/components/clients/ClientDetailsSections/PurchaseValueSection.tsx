
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-[#d3d800]/30 shadow-xl shadow-[#d3d800]/10">
      <h3 className="font-semibold text-white border-b border-[#d3d800]/30 pb-2 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-[#d3d800] rounded-full shadow-lg shadow-[#d3d800]/50"></div>
        Valor de Compra
      </h3>
      <div className="flex items-center gap-3">
        <DollarSign className="h-4 w-4 text-[#d3d800]" />
        <div className="flex-1">
          {isEditingValue ? (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="0.00"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSaveValue}
                  className="bg-[#d3d800]/80 hover:bg-[#d3d800] text-black border-2 border-[#d3d800] shadow-lg font-semibold"
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
                  className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-white/80">Valor</Label>
                <p className="text-sm font-medium text-white">{formatCurrency(client.purchase_value)}</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsEditingValue(true)}
                className="text-[#d3d800] hover:text-black hover:bg-[#d3d800]/20"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
