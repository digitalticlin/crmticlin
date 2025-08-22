
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AIAgent, AIAgentPrompt } from '@/types/aiAgent';
import { Bot, Settings } from 'lucide-react';

export interface EnhancedPromptConfigurationProps {
  agent: AIAgent;
  onSave: (updatedPrompt: AIAgentPrompt) => void;
  onCancel: () => void;
  onFormChange: (hasChanges: boolean) => void;
}

export const EnhancedPromptConfiguration = ({ 
  agent, 
  onSave, 
  onCancel, 
  onFormChange 
}: EnhancedPromptConfigurationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    agent_function: '',
    agent_objective: '',
    communication_style: '',
    company_info: '',
    products_services: '',
    rules_guidelines: '',
    prohibitions: '',
    client_objections: '',
    phrase_tips: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    onFormChange(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Mock save - replace with actual implementation
      const mockPrompt: AIAgentPrompt = {
        id: 'mock-id',
        agent_id: agent.id,
        ...formData,
        communication_style_examples: [],
        products_services_examples: [],
        rules_guidelines_examples: [],
        prohibitions_examples: [],
        client_objections_examples: [],
        phrase_tips_examples: [],
        flow: [],
        created_by_user_id: agent.created_by_user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      onSave(mockPrompt);
      onFormChange(false);
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Configuração de Prompt para {agent.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_function">Função do Agente</Label>
            <Textarea
              id="agent_function"
              value={formData.agent_function}
              onChange={(e) => handleInputChange('agent_function', e.target.value)}
              placeholder="Descreva a função principal do agente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_objective">Objetivo do Agente</Label>
            <Textarea
              id="agent_objective"
              value={formData.agent_objective}
              onChange={(e) => handleInputChange('agent_objective', e.target.value)}
              placeholder="Qual é o objetivo principal do agente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="communication_style">Estilo de Comunicação</Label>
            <Textarea
              id="communication_style"
              value={formData.communication_style}
              onChange={(e) => handleInputChange('communication_style', e.target.value)}
              placeholder="Como o agente deve se comunicar..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_info">Informações da Empresa</Label>
            <Textarea
              id="company_info"
              value={formData.company_info}
              onChange={(e) => handleInputChange('company_info', e.target.value)}
              placeholder="Informações sobre a empresa..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </div>
    </div>
  );
};
