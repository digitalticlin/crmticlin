
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";

interface PurchaseValueFieldProps {
  purchaseValue: number | undefined;
  onUpdatePurchaseValue?: (value: number | undefined) => void;
}

export const PurchaseValueField = ({ 
  purchaseValue, 
  onUpdatePurchaseValue 
}: PurchaseValueFieldProps) => {
  const [purchaseValueStr, setPurchaseValueStr] = useState(
    purchaseValue !== undefined ? purchaseValue.toString() : ""
  );
  
  // Update local state when prop changes
  useEffect(() => {
    setPurchaseValueStr(purchaseValue !== undefined ? purchaseValue.toString() : "");
  }, [purchaseValue]);
  
  const handlePurchaseValueChange = () => {
    if (!onUpdatePurchaseValue) return;
    
    const numberValue = purchaseValueStr ? parseFloat(purchaseValueStr) : undefined;
    onUpdatePurchaseValue(numberValue);
  };
  
  if (!onUpdatePurchaseValue) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <DollarSign className="h-4 w-4 mr-1" /> Valor da Compra
      </h3>
      <div className="flex items-center gap-2">
        <Input 
          type="number" 
          placeholder="0.00"
          value={purchaseValueStr}
          onChange={(e) => setPurchaseValueStr(e.target.value)}
          className="w-full"
        />
        <Button size="sm" onClick={handlePurchaseValueChange}>
          Salvar
        </Button>
      </div>
      {purchaseValue !== undefined && (
        <p className="text-sm text-muted-foreground mt-1">
          Valor atual: {formatCurrency(purchaseValue)}
        </p>
      )}
    </div>
  );
};
