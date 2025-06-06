
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Edit, Save, X } from "lucide-react";

interface PurchaseValueFieldProps {
  purchaseValue?: number;
  onUpdatePurchaseValue?: (value: number | undefined) => void;
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
    onUpdatePurchaseValue?.(numericValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(purchaseValue?.toString() || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-gray-700 font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          Valor da Negociação
        </Label>
        {onUpdatePurchaseValue && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="bg-green-500/30 hover:bg-green-500/40 text-green-700 border border-green-300/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <Input
            type="number"
            placeholder="0.00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-white/60 border-white/50 focus:border-green-400 focus:ring-green-400/20 backdrop-blur-sm shadow-sm"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-green-500/30 hover:bg-green-500/40 text-green-700 border border-green-300/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-red-500/30 hover:bg-red-500/40 text-red-700 border border-red-300/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-sm">
          <div className="text-lg font-bold text-green-700">
            {formatCurrency(purchaseValue)}
          </div>
          {purchaseValue === 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Valor zerado - Nova negociação
            </div>
          )}
        </div>
      )}
    </div>
  );
};
