import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, DollarSign, Save, X } from "lucide-react";
import { CurrentDeal } from "@/types/chat";

interface CurrentDealSectionProps {
  currentDeal?: CurrentDeal;
  onUpdateDeal?: (deal: CurrentDeal) => void;
}

export const CurrentDealSection = ({ currentDeal, onUpdateDeal }: CurrentDealSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedValue, setEditedValue] = useState(currentDeal?.value?.toString() || "");
  const [editedNotes, setEditedNotes] = useState(currentDeal?.notes || "");

  // Atualizar valores editados quando currentDeal mudar
  useEffect(() => {
    setEditedValue(currentDeal?.value?.toString() || "");
    setEditedNotes(currentDeal?.notes || "");
  }, [currentDeal]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/30 text-green-700';
      case 'pending': return 'bg-yellow-500/30 text-yellow-700';
      case 'negotiating': return 'bg-blue-500/30 text-blue-700';
      default: return 'bg-gray-500/30 text-gray-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'pending': return 'Pendente';
      case 'negotiating': return 'Negociando';
      default: return 'Indefinido';
    }
  };

  const handleSave = async () => {
    if (!currentDeal || !onUpdateDeal) return;

    const value = parseFloat(editedValue.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(value)) return;

    setIsLoading(true);
    try {
      await onUpdateDeal({
        ...currentDeal,
        value,
        notes: editedNotes
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar negociação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedValue(currentDeal?.value?.toString() || "");
    setEditedNotes(currentDeal?.notes || "");
    setIsEditing(false);
  };

  if (!currentDeal) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800">💰 Negociação Atual</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhuma negociação ativa no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800">💰 Negociação Atual</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-800 hover:bg-white/20"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Valor Atual */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Valor em Negociação:</span>
          {isEditing ? (
            <Input
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              className="w-32 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400 text-gray-800 text-right"
              placeholder="0,00"
            />
          ) : (
            <span className="text-2xl font-bold text-green-300">
              {formatCurrency(currentDeal.value)}
            </span>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <span className="text-gray-700 text-sm">Observações:</span>
          {isEditing ? (
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full p-2 bg-white/50 backdrop-blur-sm border border-white/40 rounded-md focus:border-blue-400 text-gray-800 text-sm resize-none"
              placeholder="Adicione observações sobre a negociação..."
              rows={3}
            />
          ) : (
            <p className="text-gray-800 text-sm bg-white/20 p-2 rounded-md min-h-[60px]">
              {currentDeal.notes || "Nenhuma observação adicionada"}
            </p>
          )}
        </div>

        {/* Botões de ação */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-white/30">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-white/20 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/30"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};