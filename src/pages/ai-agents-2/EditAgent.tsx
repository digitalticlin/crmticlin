import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ai-agents-2/WizardSteps";
import { Step1Basic } from "@/components/ai-agents-2/Step1Basic";
import { Step2Personality } from "@/components/ai-agents-2/Step2Personality";
import { Step3Knowledge } from "@/components/ai-agents-2/Step3Knowledge";
import { Step4Flow } from "@/components/ai-agents-2/Step4Flow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Node, Edge } from "reactflow";

const WIZARD_STEPS = [
  { number: 1, title: 'Básico', subtitle: '30 seg' },
  { number: 2, title: 'Personalidade', subtitle: '1 min' },
  { number: 3, title: 'Conhecimento', subtitle: '2-3 min' },
  { number: 4, title: 'Fluxo', subtitle: '5-10 min' },
];

export default function EditAgent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [agentData, setAgentData] = useState({
    // Step 1: Básico
    name: '',
    objective: 'sales' as 'sales' | 'support' | 'qualification',
    funnel_id: null as string | null,
    whatsapp_number_id: null as string | null,

    // Step 2: Personalidade
    communication_style: '',
    agent_profile: '',
    signature: '',
    prohibitions: [] as string[],

    // Step 3: Conhecimento
    company_info: '',
    faq: [] as { question: string; answer: string }[],

    // Step 4: Fluxo
    nodes: [] as Node[],
    edges: [] as Edge[],
    entryPointId: '',
  });

  useEffect(() => {
    if (id) {
      loadAgentData(id);
    }
  }, [id]);

  const loadAgentData = async (agentId: string) => {
    try {
      // Carregar dados do agente
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      // Carregar prompt/configurações
      const { data: prompt, error: promptError } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (promptError && promptError.code !== 'PGRST116') {
        throw promptError;
      }

      // Mapear dados para o estado
      setAgentData({
        name: agent.name || '',
        objective: agent.type || 'sales',
        funnel_id: agent.funnel_id,
        whatsapp_number_id: agent.whatsapp_number_id,
        communication_style: prompt?.communication_style || '',
        agent_profile: prompt?.agent_function || '',
        signature: prompt?.communication_style_examples?.[0]?.answer || '',
        prohibitions: (prompt?.prohibitions || []).map((p: any) => p.prohibition || p),
        company_info: prompt?.company_info || '',
        faq: (prompt?.client_objections || []).map((obj: any) => ({
          question: obj.question || obj.objection || '',
          answer: obj.answer || obj.response || ''
        })),
        nodes: [], // Flow nodes precisariam ser reconstruídos
        edges: [],
        entryPointId: '',
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
      toast.error('Erro ao carregar dados do agente');
      navigate('/ai-agents-2');
    }
  };

  const handleChange = (field: string, value: any) => {
    setAgentData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.')) {
      navigate('/ai-agents-2');
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      // 1. Atualizar agente básico
      const { error: agentError } = await supabase
        .from('ai_agents')
        .update({
          name: agentData.name,
          type: agentData.objective,
          funnel_id: agentData.funnel_id,
          whatsapp_number_id: agentData.whatsapp_number_id,
        })
        .eq('id', id);

      if (agentError) throw agentError;

      // 2. Atualizar ou criar prompt
      const { data: existingPrompt } = await supabase
        .from('ai_agent_prompts')
        .select('id')
        .eq('agent_id', id)
        .single();

      const promptData = {
        agent_id: id,
        agent_function: agentData.agent_profile,
        agent_objective: `Objetivo: ${agentData.objective}`,
        communication_style: agentData.communication_style,
        communication_style_examples: agentData.signature ? [
          {
            id: '1',
            question: 'Como assinar mensagens?',
            answer: agentData.signature
          }
        ] : [],
        company_info: agentData.company_info,
        products_services: '',
        rules_guidelines: [],
        prohibitions: agentData.prohibitions.map((p, i) => ({
          id: `${i + 1}`,
          prohibition: p
        })),
        client_objections: agentData.faq.map((qa, i) => ({
          id: `${i + 1}`,
          question: qa.question,
          answer: qa.answer
        })),
        flow: agentData.nodes.map((node, index) => ({
          id: node.id,
          description: node.data.label,
          examples: [],
          order: index
        })),
      };

      if (existingPrompt) {
        const { error: updateError } = await supabase
          .from('ai_agent_prompts')
          .update(promptData)
          .eq('id', existingPrompt.id);

        if (updateError) throw updateError;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error: insertError } = await supabase
          .from('ai_agent_prompts')
          .insert({ ...promptData, created_by_user_id: user?.id });

        if (insertError) throw insertError;
      }

      toast.success('✅ Agente atualizado com sucesso!');
      navigate('/ai-agents-2');
    } catch (error) {
      console.error('❌ Erro ao atualizar agente:', error);
      toast.error('Erro ao atualizar agente');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ticlin border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do agente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-20">
      <PageHeader
        title="Editar Agente de IA"
        description={`Etapa ${currentStep} de 4: ${WIZARD_STEPS[currentStep - 1].title}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WizardSteps currentStep={currentStep} steps={WIZARD_STEPS} />

        <div className="mt-8">
          {currentStep === 1 && (
            <Step1Basic
              data={{
                name: agentData.name,
                objective: agentData.objective,
                funnel_id: agentData.funnel_id,
                whatsapp_number_id: agentData.whatsapp_number_id,
              }}
              onChange={handleChange}
              onNext={handleNext}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 2 && (
            <Step2Personality
              data={{
                communication_style: agentData.communication_style,
                agent_profile: agentData.agent_profile,
                signature: agentData.signature,
                prohibitions: agentData.prohibitions,
              }}
              onChange={handleChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <Step3Knowledge
              data={{
                company_info: agentData.company_info,
                faq: agentData.faq,
              }}
              onChange={handleChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <Step4Flow
              data={{
                nodes: agentData.nodes,
                edges: agentData.edges,
                entryPointId: agentData.entryPointId,
              }}
              onChange={handleChange}
              onSave={handleSave}
              onBack={handleBack}
            />
          )}
        </div>
      </div>

      {isSaving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-ticlin border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Salvando alterações...</h3>
            <p className="text-sm text-gray-600">Aguarde enquanto atualizamos o agente</p>
          </div>
        </div>
      )}
    </div>
  );
}
