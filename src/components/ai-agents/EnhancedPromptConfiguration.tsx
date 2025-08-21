import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface EnhancedPromptConfigurationProps {
  agentId: string;
  onSave?: () => void;
}

export const EnhancedPromptConfiguration: React.FC<EnhancedPromptConfigurationProps> = ({ agentId, onSave }) => {
  const [agentFunction, setAgentFunction] = useState('');
  const [agentObjective, setAgentObjective] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [rulesGuidelines, setRulesGuidelines] = useState('');
  const [prohibitions, setProhibitions] = useState('');
  const [clientObjections, setClientObjections] = useState('');
  const [phraseTips, setPhraseTips] = useState('');
  const [flow, setFlow] = useState('');
  const [communicationStyleExamples, setCommunicationStyleExamples] = useState('');
  const [productsServicesExamples, setProductsServicesExamples] = useState('');
  const [rulesGuidelinesExamples, setRulesGuidelinesExamples] = useState('');
  const [prohibitionsExamples, setProhibitionsExamples] = useState('');
  const [clientObjectionsExamples, setClientObjectionsExamples] = useState('');
  const [phraseTipsExamples, setPhraseTipsExamples] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_agent_prompts')
          .select('*')
          .eq('agent_id', agentId)
          .single();

        if (error) throw error;

        if (data) {
          setAgentFunction(data.agent_function || '');
          setAgentObjective(data.agent_objective || '');
          setCompanyInfo(data.company_info || '');
          setProductsServices(data.products_services || '');
          setCommunicationStyle(data.communication_style || '');
          setRulesGuidelines(data.rules_guidelines || '');
          setProhibitions(data.prohibitions || '');
          setClientObjections(data.client_objections || '');
          setPhraseTips(data.phrase_tips || '');
          setFlow(data.flow || '');
          setCommunicationStyleExamples(data.communication_style_examples || '');
          setProductsServicesExamples(data.products_services_examples || '');
          setRulesGuidelinesExamples(data.rules_guidelines_examples || '');
          setProhibitionsExamples(data.prohibitions_examples || '');
          setClientObjectionsExamples(data.client_objections_examples || '');
          setPhraseTipsExamples(data.phrase_tips_examples || '');
        }
      } catch (error) {
        console.error('Error fetching prompt:', error);
        toast.error('Erro ao carregar prompt');
      }
    };

    if (agentId) {
      fetchPrompt();
    }
  }, [agentId]);

const savePrompt = async () => {
  try {
    setIsSaving(true);
    
    const promptData = {
      agent_id: agentId,
      agent_function: agentFunction,
      agent_objective: agentObjective,
      company_info: companyInfo,
      products_services: productsServices,
      communication_style: communicationStyle,
      rules_guidelines: rulesGuidelines,
      prohibitions: prohibitions,
      client_objections: clientObjections,
      phrase_tips: phraseTips,
      flow: flow,
      communication_style_examples: communicationStyleExamples,
      products_services_examples: productsServicesExamples,
      rules_guidelines_examples: rulesGuidelinesExamples,
      prohibitions_examples: prohibitionsExamples,
      client_objections_examples: clientObjectionsExamples,
      phrase_tips_examples: phraseTipsExamples,
      created_by_user_id: user?.id
    };

    // Fix: Remove extra parameters
    const { data, error } = await supabase
      .from('ai_agent_prompts')
      .upsert([promptData], { onConflict: 'agent_id' });

    if (error) throw error;

    toast.success('Prompt salvo com sucesso!');
    if (onSave) onSave();
  } catch (error) {
    console.error('Error saving prompt:', error);
    toast.error('Erro ao salvar prompt');
  } finally {
    setIsSaving(false);
  }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração Avançada do Prompt</CardTitle>
        <CardDescription>
          Defina o comportamento e as diretrizes do agente de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agentFunction">Função do Agente</Label>
            <Textarea
              id="agentFunction"
              placeholder="Ex: Atendimento ao cliente, vendas, suporte técnico"
              value={agentFunction}
              onChange={(e) => setAgentFunction(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="agentObjective">Objetivo do Agente</Label>
            <Textarea
              id="agentObjective"
              placeholder="Ex: Resolver dúvidas, qualificar leads, fechar vendas"
              value={agentObjective}
              onChange={(e) => setAgentObjective(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyInfo">Informações da Empresa</Label>
            <Textarea
              id="companyInfo"
              placeholder="Ex: Breve descrição da empresa, missão, valores"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="productsServices">Produtos e Serviços</Label>
            <Textarea
              id="productsServices"
              placeholder="Ex: Lista detalhada dos produtos e serviços oferecidos"
              value={productsServices}
              onChange={(e) => setProductsServices(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="communicationStyle">Estilo de Comunicação</Label>
            <Textarea
              id="communicationStyle"
              placeholder="Ex: Formal, informal, amigável, técnico"
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="rulesGuidelines">Regras e Diretrizes</Label>
            <Textarea
              id="rulesGuidelines"
              placeholder="Ex: Boas práticas, políticas internas, informações confidenciais"
              value={rulesGuidelines}
              onChange={(e) => setRulesGuidelines(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prohibitions">Proibições</Label>
            <Textarea
              id="prohibitions"
              placeholder="Ex: Assuntos que o agente não deve abordar, informações que não deve divulgar"
              value={prohibitions}
              onChange={(e) => setProhibitions(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="clientObjections">Objeções de Clientes</Label>
            <Textarea
              id="clientObjections"
              placeholder="Ex: Lista de objeções comuns e como o agente deve respondê-las"
              value={clientObjections}
              onChange={(e) => setClientObjections(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="phraseTips">Dicas de Frases</Label>
          <Textarea
            id="phraseTips"
            placeholder="Ex: Frases de efeito, gatilhos mentais, palavras persuasivas"
            value={phraseTips}
            onChange={(e) => setPhraseTips(e.target.value)}
          />
        </div>

        <Separator />

        <div>
          <Label htmlFor="flow">Fluxo de Conversa</Label>
          <Textarea
            id="flow"
            placeholder="Ex: Roteiro da conversa, perguntas a serem feitas, informações a serem coletadas"
            value={flow}
            onChange={(e) => setFlow(e.target.value)}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="communicationStyleExamples">Exemplos de Estilo de Comunicação</Label>
            <Textarea
              id="communicationStyleExamples"
              placeholder="Ex: Exemplos de como o agente deve se comunicar em diferentes situações"
              value={communicationStyleExamples}
              onChange={(e) => setCommunicationStyleExamples(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="productsServicesExamples">Exemplos de Produtos e Serviços</Label>
            <Textarea
              id="productsServicesExamples"
              placeholder="Ex: Exemplos de como apresentar os produtos e serviços da empresa"
              value={productsServicesExamples}
              onChange={(e) => setProductsServicesExamples(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rulesGuidelinesExamples">Exemplos de Regras e Diretrizes</Label>
            <Textarea
              id="rulesGuidelinesExamples"
              placeholder="Ex: Exemplos de como o agente deve seguir as regras e diretrizes da empresa"
              value={rulesGuidelinesExamples}
              onChange={(e) => setRulesGuidelinesExamples(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="prohibitionsExamples">Exemplos de Proibições</Label>
            <Textarea
              id="prohibitionsExamples"
              placeholder="Ex: Exemplos de assuntos que o agente não deve abordar"
              value={prohibitionsExamples}
              onChange={(e) => setProhibitionsExamples(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientObjectionsExamples">Exemplos de Objeções de Clientes</Label>
            <Textarea
              id="clientObjectionsExamples"
              placeholder="Ex: Exemplos de como o agente deve responder a objeções de clientes"
              value={clientObjectionsExamples}
              onChange={(e) => setClientObjectionsExamples(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phraseTipsExamples">Exemplos de Dicas de Frases</Label>
            <Textarea
              id="phraseTipsExamples"
              placeholder="Ex: Exemplos de como usar frases de efeito e gatilhos mentais"
              value={phraseTipsExamples}
              onChange={(e) => setPhraseTipsExamples(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={savePrompt} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Prompt'}
        </Button>
      </CardContent>
    </Card>
  );
};
