
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Target } from "lucide-react";

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
    <div className="space-y-3">
      {/* Adicionar novo objetivo */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg transition-all duration-300 hover:bg-white/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
            <Plus className="h-4 w-4 text-yellow-500" />
            Adicionar Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Descreva um objetivo específico do agente..."
              className="flex-1 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm h-8"
              onKeyPress={(e) => e.key === 'Enter' && addObjective()}
            />
            <Button 
              onClick={addObjective}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 h-8 rounded-lg shadow-glass transition-all duration-200 text-sm"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de objetivos */}
      {objectives.length > 0 && (
        <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-lg transition-all duration-300 hover:bg-white/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
              <Target className="h-4 w-4 text-yellow-500" />
              Objetivos Configurados ({objectives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {objectives.map((objective, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 p-2 bg-white/40 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/60 transition-all duration-200 shadow-glass"
                >
                  <div className="flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <Input
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg text-sm h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg flex-shrink-0 shadow-glass p-1 h-8 w-8"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {objectives.length === 0 && (
        <div className="text-center py-6 text-gray-600">
          <Target className="h-10 w-10 mx-auto mb-2 text-yellow-500" />
          <p className="font-medium text-sm">Nenhum objetivo configurado ainda.</p>
          <p className="text-xs">Adicione objetivos para guiar o comportamento do seu agente.</p>
        </div>
      )}
    </div>
  );
};
