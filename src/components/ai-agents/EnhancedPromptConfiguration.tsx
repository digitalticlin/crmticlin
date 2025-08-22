import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAgent, PQExample, FlowStepEnhanced } from "@/types/aiAgent";

export interface EnhancedPromptConfigurationProps {
  agent?: AIAgent;
  promptData: {
    agent_function: string;
    agent_objective: string;
    communication_style: string;
    communication_style_examples: PQExample[];
    company_info: string;
    products_services: string;
    client_objections: string;
    client_objections_examples: PQExample[];
    business_rules: string;
    business_rules_examples: PQExample[];
    fallback_responses: string;
    conversation_flow: string;
    flow: FlowStepEnhanced[];
  };
  onPromptDataChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EnhancedPromptConfiguration({
  agent,
  promptData,
  onPromptDataChange,
  onSave,
  onCancel
}: EnhancedPromptConfigurationProps) {
  const [localPromptData, setLocalPromptData] = useState(promptData);

  useEffect(() => {
    setLocalPromptData(promptData);
  }, [promptData]);

  const handleInputChange = (field: string, value: string) => {
    setLocalPromptData(prev => ({
      ...prev,
      [field]: value
    }));
    onPromptDataChange(field, value);
  };

  const handleExamplesChange = (field: string, examples: PQExample[]) => {
    setLocalPromptData(prev => ({
      ...prev,
      [field]: examples
    }));
    onPromptDataChange(field, examples);
  };

  const handleFlowChange = (flow: FlowStepEnhanced[]) => {
    setLocalPromptData(prev => ({
      ...prev,
      flow: flow
    }));
    onPromptDataChange("flow", flow);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração Avançada do Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="agent_function">Função do Agente</Label>
          <Textarea
            id="agent_function"
            value={localPromptData.agent_function}
            onChange={(e) => handleInputChange("agent_function", e.target.value)}
            placeholder="Ex: Responder dúvidas sobre produtos"
          />
        </div>

        <div>
          <Label htmlFor="agent_objective">Objetivo do Agente</Label>
          <Textarea
            id="agent_objective"
            value={localPromptData.agent_objective}
            onChange={(e) => handleInputChange("agent_objective", e.target.value)}
            placeholder="Ex: Aumentar as vendas em 10%"
          />
        </div>

        <div>
          <Label htmlFor="communication_style">Estilo de Comunicação</Label>
          <Textarea
            id="communication_style"
            value={localPromptData.communication_style}
            onChange={(e) => handleInputChange("communication_style", e.target.value)}
            placeholder="Ex: Formal, amigável, etc."
          />
        </div>

        {/* ExamplesManager for communication_style_examples */}
        {/* ExamplesManager for client_objections_examples */}
        {/* ExamplesManager for business_rules_examples */}

        <div>
          <Label htmlFor="company_info">Informações da Empresa</Label>
          <Textarea
            id="company_info"
            value={localPromptData.company_info}
            onChange={(e) => handleInputChange("company_info", e.target.value)}
            placeholder="Ex: Nome, história, valores"
          />
        </div>

        <div>
          <Label htmlFor="products_services">Produtos/Serviços</Label>
          <Textarea
            id="products_services"
            value={localPromptData.products_services}
            onChange={(e) => handleInputChange("products_services", e.target.value)}
            placeholder="Ex: Lista de produtos e serviços"
          />
        </div>

        <div>
          <Label htmlFor="client_objections">Objeções de Clientes</Label>
          <Textarea
            id="client_objections"
            value={localPromptData.client_objections}
            onChange={(e) => handleInputChange("client_objections", e.target.value)}
            placeholder="Ex: Lista de objeções comuns"
          />
        </div>

        <div>
          <Label htmlFor="business_rules">Regras de Negócio</Label>
          <Textarea
            id="business_rules"
            value={localPromptData.business_rules}
            onChange={(e) => handleInputChange("business_rules", e.target.value)}
            placeholder="Ex: Regras para descontos, frete, etc."
          />
        </div>

        <div>
          <Label htmlFor="fallback_responses">Respostas de Fallback</Label>
          <Textarea
            id="fallback_responses"
            value={localPromptData.fallback_responses}
            onChange={(e) => handleInputChange("fallback_responses", e.target.value)}
            placeholder="Ex: Respostas quando não entender a pergunta"
          />
        </div>

        <div>
          <Label htmlFor="conversation_flow">Fluxo de Conversa</Label>
          <Textarea
            id="conversation_flow"
            value={localPromptData.conversation_flow}
            onChange={(e) => handleInputChange("conversation_flow", e.target.value)}
            placeholder="Ex: Descrição do fluxo da conversa"
          />
        </div>

        {/* FlowStepManager for flow */}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
