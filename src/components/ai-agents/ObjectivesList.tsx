
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, GripVertical, Target } from "lucide-react";

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
    onChange(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Adicionar novo objetivo */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Plus className="h-5 w-5 text-yellow-500" />
            Adicionar Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Descreva um objetivo específico do agente..."
              className="flex-1 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && addObjective()}
            />
            <Button 
              onClick={addObjective}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 rounded-lg shadow-glass transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de objetivos */}
      {objectives.length > 0 && (
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl transition-all duration-300 hover:bg-white/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Target className="h-5 w-5 text-yellow-500" />
              Objetivos Configurados ({objectives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {objectives.map((objective, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white/40 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/60 transition-all duration-200 shadow-glass"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <Input
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg flex-shrink-0 shadow-glass"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {objectives.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <Target className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
          <p className="font-medium">Nenhum objetivo configurado ainda.</p>
          <p className="text-sm">Adicione objetivos para guiar o comportamento do seu agente.</p>
        </div>
      )}
    </div>
  );
};
