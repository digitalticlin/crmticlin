
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ObjectivesListProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
}

export const ObjectivesList = ({ objectives, onChange }: ObjectivesListProps) => {
  const [newObjective, setNewObjective] = useState("");

  const addObjective = () => {
    if (newObjective.trim()) {
      onChange([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    const updated = objectives.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    onChange(updated);
  };

  const moveObjective = (fromIndex: number, toIndex: number) => {
    const updated = [...objectives];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Adicionar novo objetivo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Adicionar Novo Objetivo</h4>
        </div>
        <div className="flex gap-3">
          <Input
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            placeholder="Ex: Passo 1 - Identificar a necessidade do cliente e fazer perguntas qualificadoras..."
            onKeyPress={(e) => e.key === 'Enter' && addObjective()}
            className="flex-1 border-2 border-blue-200 focus:border-blue-500 rounded-lg"
          />
          <Button 
            type="button" 
            onClick={addObjective} 
            disabled={!newObjective.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Lista de objetivos */}
      {objectives.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-indigo-600" />
            <h4 className="font-semibold text-gray-800">
              Objetivos Configurados ({objectives.length})
            </h4>
          </div>
          
          {objectives.map((objective, index) => (
            <Card key={index} className="border-2 border-gray-100 hover:border-gray-200 transition-colors duration-200 bg-white shadow-sm hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move flex-shrink-0" />
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                      Passo {index + 1}
                    </div>
                  </div>
                  
                  <Input
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 border-2 border-gray-200 focus:border-indigo-500 rounded-lg min-w-0"
                    placeholder="Descreva o objetivo..."
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg flex-shrink-0 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {objectives.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum objetivo definido</h3>
          <p className="text-gray-500 mb-4">Adicione objetivos para guiar o comportamento do agente.</p>
          <div className="text-sm text-gray-400">
            💡 Dica: Objetivos bem definidos tornam o agente mais eficiente
          </div>
        </div>
      )}
    </div>
  );
};
