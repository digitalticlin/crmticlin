
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Edit, Save, X, TrendingUp } from "lucide-react";

interface GlassmorphismPurchaseValueProps {
  purchaseValue?: number;
  onUpdatePurchaseValue?: (value: number | undefined) => void;
}

export const GlassmorphismPurchaseValue = ({
  purchaseValue,
  onUpdatePurchaseValue
}: GlassmorphismPurchaseValueProps) => {
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-white/90 font-medium flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-xl shadow-lg shadow-lime-400/30">
            <DollarSign className="h-5 w-5 text-black" />
          </div>
          Valor da Negociação
        </Label>
        {onUpdatePurchaseValue && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-lime-400/20 to-yellow-300/20 hover:from-lime-400/30 hover:to-yellow-300/30 text-lime-300 border border-lime-400/40 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-lime-400/20"
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
            className="bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-gradient-to-r from-lime-400/90 to-yellow-300/90 backdrop-blur-sm text-black font-semibold hover:from-lime-500/90 hover:to-yellow-400/90 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 transition-all duration-200 hover:scale-105"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-lime-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-5 border border-lime-400/40 shadow-inner">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-lime-400" />
            <div className="text-2xl font-bold text-lime-300 drop-shadow-lg">
              {formatCurrency(purchaseValue)}
            </div>
          </div>
          {purchaseValue === 0 && (
            <div className="text-xs text-white/60 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
              💡 Valor zerado - Nova negociação
            </div>
          )}
        </div>
      )}
    </div>
  );
};
