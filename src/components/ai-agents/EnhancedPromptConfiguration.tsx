
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnhancedPromptConfigurationProps {
  onSave?: (config: any) => void;
}

export function EnhancedPromptConfiguration({ onSave }: EnhancedPromptConfigurationProps) {
  const [config, setConfig] = useState({
    systemPrompt: "",
    objective: "",
    function: "",
    greeting: "",
  });

  const handleSave = () => {
    onSave?.(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Prompt Avançada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="objective">Objetivo do Agente</Label>
          <Textarea
            id="objective"
            value={config.objective}
            onChange={(e) => setConfig(prev => ({ ...prev, objective: e.target.value }))}
            placeholder="Descreva o objetivo principal do agente..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="function">Função</Label>
          <Textarea
            id="function"
            value={config.function}
            onChange={(e) => setConfig(prev => ({ ...prev, function: e.target.value }))}
            placeholder="Descreva a função específica do agente..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting">Saudação</Label>
          <Textarea
            id="greeting"
            value={config.greeting}
            onChange={(e) => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
            placeholder="Digite a mensagem de saudação..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
          <Textarea
            id="systemPrompt"
            value={config.systemPrompt}
            onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
            placeholder="Digite o prompt completo do sistema..."
            rows={6}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
}
