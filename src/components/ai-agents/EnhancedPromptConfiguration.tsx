import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AIAgentPrompt, PQExample } from '@/types/aiAgent';

interface EnhancedPromptConfigurationProps {
  prompt: AIAgentPrompt;
  onSave: (updatedPrompt: AIAgentPrompt) => void;
  isLoading: boolean;
}

export const EnhancedPromptConfiguration = ({ prompt, onSave, isLoading }: EnhancedPromptConfigurationProps) => {
  const [agentFunction, setAgentFunction] = useState(prompt.agent_function);
  const [agentObjective, setAgentObjective] = useState(prompt.agent_objective);
  const [communicationStyle, setCommunicationStyle] = useState(prompt.communication_style);
  const [companyInfo, setCompanyInfo] = useState(prompt.company_info);
  const [productsServices, setProductsServices] = useState(prompt.products_services);
  const [rulesGuidelines, setRulesGuidelines] = useState(prompt.rules_guidelines);
  const [prohibitions, setProhibitions] = useState(prompt.prohibitions);
  const [clientObjections, setClientObjections] = useState(prompt.client_objections);
  const [phraseTips, setPhraseTips] = useState(prompt.phrase_tips);

  const [examples, setExamples] = useState({
    communication_style_examples: prompt.communication_style_examples,
    products_services_examples: prompt.products_services_examples,
    rules_guidelines_examples: prompt.rules_guidelines_examples,
    prohibitions_examples: prompt.prohibitions_examples,
    client_objections_examples: prompt.client_objections_examples,
    phrase_tips_examples: prompt.phrase_tips_examples,
  });

  const handleSave = () => {
    const updatedPrompt: AIAgentPrompt = {
      ...prompt,
      agent_function: agentFunction,
      agent_objective: agentObjective,
      communication_style: communicationStyle,
      communication_style_examples: examples.communication_style_examples,
      company_info: companyInfo,
      products_services: productsServices,
      products_services_examples: examples.products_services_examples,
      rules_guidelines: rulesGuidelines,
      rules_guidelines_examples: examples.rules_guidelines_examples,
      prohibitions: prohibitions,
      prohibitions_examples: examples.prohibitions_examples,
      client_objections: clientObjections,
      client_objections_examples: examples.client_objections_examples,
      phrase_tips: phraseTips,
      phrase_tips_examples: examples.phrase_tips_examples,
    };
    onSave(updatedPrompt);
  };

  const addExample = (field: keyof typeof examples) => {
    setExamples(prev => ({
      ...prev,
      [field]: [...prev[field], { id: Date.now().toString(), question: '', answer: '' }]
    }));
  };

  const removeExample = (field: keyof typeof examples, id: string) => {
    setExamples(prev => ({
      ...prev,
      [field]: prev[field].filter(ex => ex.id !== id)
    }));
  };

  const updateExample = (field: keyof typeof examples, id: string, key: 'question' | 'answer', value: string) => {
    setExamples(prev => ({
      ...prev,
      [field]: prev[field].map(ex => ex.id === id ? { ...ex, [key]: value } : ex)
    }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 p-4">
        {/* Agent Function and Objective */}
        <Card>
          <CardHeader>
            <CardTitle>Função e Objetivo do Agente</CardTitle>
            <CardDescription>Defina o papel e meta principal do agente.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="agentFunction">Função do Agente</Label>
              <Input
                id="agentFunction"
                value={agentFunction}
                onChange={(e) => setAgentFunction(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agentObjective">Objetivo do Agente</Label>
              <Textarea
                id="agentObjective"
                value={agentObjective}
                onChange={(e) => setAgentObjective(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Communication Style */}
        <Card>
          <CardHeader>
            <CardTitle>Estilo de Comunicação</CardTitle>
            <CardDescription>
              Descreva como o agente deve se comunicar (formal, amigável, etc.).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="communicationStyle">Estilo de Comunicação</Label>
              <Textarea
                id="communicationStyle"
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Exemplos de Estilo</Label>
              {examples.communication_style_examples.map((example, index) => (
                <div key={example.id} className="flex items-start gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`communicationStyleQuestion-${index}`}>Pergunta</Label>
                    <Input
                      id={`communicationStyleQuestion-${index}`}
                      value={example.question}
                      onChange={(e) => updateExample('communication_style_examples', example.id, 'question', e.target.value)}
                    />
                    <Label htmlFor={`communicationStyleAnswer-${index}`}>Resposta</Label>
                    <Textarea
                      id={`communicationStyleAnswer-${index}`}
                      value={example.answer}
                      onChange={(e) => updateExample('communication_style_examples', example.id, 'answer', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeExample('communication_style_examples', example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addExample('communication_style_examples')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
            <CardDescription>
              Detalhes sobre a empresa para o agente usar como referência.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyInfo">Informações da Empresa</Label>
              <Textarea
                id="companyInfo"
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products and Services */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos e Serviços</CardTitle>
            <CardDescription>
              Lista dos produtos e serviços oferecidos pela empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productsServices">Produtos e Serviços</Label>
              <Textarea
                id="productsServices"
                value={productsServices}
                onChange={(e) => setProductsServices(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Exemplos de Produtos/Serviços</Label>
              {examples.products_services_examples.map((example, index) => (
                <div key={example.id} className="flex items-start gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`productsServicesQuestion-${index}`}>Pergunta</Label>
                    <Input
                      id={`productsServicesQuestion-${index}`}
                      value={example.question}
                      onChange={(e) => updateExample('products_services_examples', example.id, 'question', e.target.value)}
                    />
                    <Label htmlFor={`productsServicesAnswer-${index}`}>Resposta</Label>
                    <Textarea
                      id={`productsServicesAnswer-${index}`}
                      value={example.answer}
                      onChange={(e) => updateExample('products_services_examples', example.id, 'answer', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeExample('products_services_examples', example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addExample('products_services_examples')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rules and Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Regras e Diretrizes</CardTitle>
            <CardDescription>
              Instruções sobre como o agente deve operar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rulesGuidelines">Regras e Diretrizes</Label>
              <Textarea
                id="rulesGuidelines"
                value={rulesGuidelines}
                onChange={(e) => setRulesGuidelines(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Exemplos de Regras/Diretrizes</Label>
              {examples.rules_guidelines_examples.map((example, index) => (
                <div key={example.id} className="flex items-start gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`rulesGuidelinesQuestion-${index}`}>Pergunta</Label>
                    <Input
                      id={`rulesGuidelinesQuestion-${index}`}
                      value={example.question}
                      onChange={(e) => updateExample('rules_guidelines_examples', example.id, 'question', e.target.value)}
                    />
                    <Label htmlFor={`rulesGuidelinesAnswer-${index}`}>Resposta</Label>
                    <Textarea
                      id={`rulesGuidelinesAnswer-${index}`}
                      value={example.answer}
                      onChange={(e) => updateExample('rules_guidelines_examples', example.id, 'answer', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeExample('rules_guidelines_examples', example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addExample('rules_guidelines_examples')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prohibitions */}
        <Card>
          <CardHeader>
            <CardTitle>Proibições</CardTitle>
            <CardDescription>
              Ações ou informações que o agente deve evitar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prohibitions">Proibições</Label>
              <Textarea
                id="prohibitions"
                value={prohibitions}
                onChange={(e) => setProhibitions(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Exemplos de Proibições</Label>
              {examples.prohibitions_examples.map((example, index) => (
                <div key={example.id} className="flex items-start gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`prohibitionsQuestion-${index}`}>Pergunta</Label>
                    <Input
                      id={`prohibitionsQuestion-${index}`}
                      value={example.question}
                      onChange={(e) => updateExample('prohibitions_examples', example.id, 'question', e.target.value)}
                    />
                    <Label htmlFor={`prohibitionsAnswer-${index}`}>Resposta</Label>
                    <Textarea
                      id={`prohibitionsAnswer-${index}`}
                      value={example.answer}
                      onChange={(e) => updateExample('prohibitions_examples', example.id, 'answer', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeExample('prohibitions_examples', example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addExample('prohibitions_examples')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Objections */}
        <Card>
          <CardHeader>
            <CardTitle>Objeções do Cliente</CardTitle>
            <CardDescription>
              Respostas para as objeções comuns dos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="clientObjections">Objeções do Cliente</Label>
              <Textarea
                id="clientObjections"
                value={clientObjections}
                onChange={(e) => setClientObjections(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Exemplos de Objeções</Label>
              {examples.client_objections_examples.map((example, index) => (
                <div key={example.id} className="flex items-start gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`clientObjectionsQuestion-${index}`}>Pergunta</Label>
                    <Input
                      id={`clientObjectionsQuestion-${index}`}
                      value={example.question}
                      onChange={(e) => updateExample('client_objections_examples', example.id, 'question', e.target.value)}
                    />
                    <Label htmlFor={`clientObjectionsAnswer-${index}`}>Resposta</Label>
                    <Textarea
                      id={`clientObjectionsAnswer-${index}`}
                      value={example.answer}
                      onChange={(e) => updateExample('client_objections_examples', example.id, 'answer', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeExample('client_objections_examples', example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addExample('client_objections_examples')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phrase Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Dicas de Frases</CardTitle>
            <CardDescription>
              Sugestões de frases para o agente usar em diferentes situações.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phraseTips">Dicas de Frases</Label>
              <Textarea
                id="phraseTips"
                value={phraseTips}
                onChange={(e) => setPhraseTips(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Exemplos de Frases</Label>
              {examples.phrase_tips_examples.map((example, index) => (
                <div key={example.id} className="flex items-start gap-2">
                  <div className="grid gap-1 flex-1">
                    <Label htmlFor={`phraseTipsQuestion-${index}`}>Pergunta</Label>
                    <Input
                      id={`phraseTipsQuestion-${index}`}
                      value={example.question}
                      onChange={(e) => updateExample('phrase_tips_examples', example.id, 'question', e.target.value)}
                    />
                    <Label htmlFor={`phraseTipsAnswer-${index}`}>Resposta</Label>
                    <Textarea
                      id={`phraseTipsAnswer-${index}`}
                      value={example.answer}
                      onChange={(e) => updateExample('phrase_tips_examples', example.id, 'answer', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeExample('phrase_tips_examples', example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addExample('phrase_tips_examples')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </ScrollArea>
  );
};
