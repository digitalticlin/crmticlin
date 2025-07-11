
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newObjective}
          onChange={(e) => setNewObjective(e.target.value)}
          placeholder="Ex: Passo 1 - Identificar a necessidade do cliente..."
          onKeyPress={(e) => e.key === 'Enter' && addObjective()}
        />
        <Button type="button" onClick={addObjective} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                Passo {index + 1}:
              </span>
              <Input
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeObjective(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {objectives.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum objetivo definido ainda.</p>
          <p className="text-sm">Adicione objetivos para guiar o comportamento do agente.</p>
        </div>
      )}
    </div>
  );
};
