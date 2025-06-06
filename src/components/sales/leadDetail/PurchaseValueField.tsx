
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Edit, Save, X } from "lucide-react";

interface PurchaseValueFieldProps {
  purchaseValue?: number;
  onUpdatePurchaseValue: (value: number | undefined) => void;
}

export const PurchaseValueField = ({
  purchaseValue,
  onUpdatePurchaseValue
}: PurchaseValueFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(purchaseValue?.toString() || "");

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSave = () => {
    const numericValue = value ? parseFloat(value.replace(',', '.')) : undefined;
    onUpdatePurchaseValue(numericValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(purchaseValue?.toString() || "");
    setIsEditing(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-gray-800 font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-lime-400" />
          Valor da Negociação
        </Label>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-lime-400 hover:text-lime-500 hover:bg-lime-50 rounded-lg"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <Input
            type="number"
            placeholder="0.00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-white/70 border-white/30 focus:border-lime-400 focus:ring-lime-400/20"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg font-semibold"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-white/70 border-white/30 text-gray-700 hover:bg-white/80 shadow-lg"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-gray-800">
          {formatCurrency(purchaseValue)}
        </div>
      )}
    </div>
  );
};
