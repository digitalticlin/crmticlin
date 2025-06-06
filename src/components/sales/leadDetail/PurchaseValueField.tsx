
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
  const [valueStr, setValueStr] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Update local state when prop changes
  useEffect(() => {
    if (purchaseValue !== undefined) {
      setValueStr(formatCurrency(purchaseValue));
    } else {
      setValueStr("");
    }
  }, [purchaseValue]);

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const amount = parseFloat(numbers) / 100;
    
    // Formata como moeda
    if (numbers === '') return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const parseCurrencyToNumber = (formattedValue: string): number => {
    // Remove símbolos de moeda e converte para número
    const numbers = formattedValue.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numbers) || 0;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrencyInput(inputValue);
    setValueStr(formatted);
  };
  
  const handleSave = () => {
    if (!onUpdatePurchaseValue) return;
    
    const numberValue = valueStr ? parseCurrencyToNumber(valueStr) : undefined;
    onUpdatePurchaseValue(numberValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (purchaseValue !== undefined) {
      setValueStr(formatCurrency(purchaseValue));
    } else {
      setValueStr("");
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };
  
  if (!onUpdatePurchaseValue) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <DollarSign className="h-4 w-4 mr-1" /> Valor da Negociação
      </h3>
      
      {isEditing ? (
        <div className="space-y-2">
          <Input 
            type="text" 
            placeholder="R$ 0,00"
            value={valueStr}
            onChange={handleValueChange}
            className="w-full"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div 
            className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleEdit}
          >
            <p className="text-sm">
              {purchaseValue !== undefined ? formatCurrency(purchaseValue) : "Clique para definir valor"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleEdit} className="w-full">
            {purchaseValue !== undefined ? "Editar Valor" : "Definir Valor"}
          </Button>
        </div>
      )}
    </div>
  );
};
