import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ai-agents-2/WizardSteps";
import { Step1Basic } from "@/components/ai-agents-2/Step1Basic";
import { Step2Personality } from "@/components/ai-agents-2/Step2Personality";
import { Step3Knowledge } from "@/components/ai-agents-2/Step3Knowledge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Node, Edge } from "reactflow";

const WIZARD_STEPS = [
  { number: 1, title: 'Básico', subtitle: '' },
  { number: 2, title: 'Personalidade', subtitle: '' },
  { number: 3, title: 'Conhecimento', subtitle: '' },
];

export default function CreateAgent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleChange = (field: string, value: any) => {
    setAgentData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      navigate('/ai-agents-2');
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // 2. Criar agente básico
      const { data: newAgent, error: agentError } = await supabase
        .from('ai_agents')
        .insert({
          name: agentData.name,
          type: agentData.objective,
          funnel_id: agentData.funnel_id,
          whatsapp_number_id: agentData.whatsapp_number_id,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      console.log('✅ Agente criado:', newAgent.id);

      // 3. Criar prompt/configuração do agente
      const { error: promptError } = await supabase
        .from('ai_agent_prompts')
        .insert({
          agent_id: newAgent.id,
          agent_function: agentData.agent_profile, // Perfil do agente
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
          products_services: '', // Pode ser adicionado depois
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
          created_by_user_id: user.id,
        });

      if (promptError) throw promptError;

      console.log('✅ Configurações do agente salvas');

      toast.success('🎉 Agente criado com sucesso!', {
        description: `${agentData.name} está pronto para usar`,
        duration: 5000,
      });

      // Redirecionar para lista
      navigate('/ai-agents-2');
    } catch (error) {
      console.error('❌ Erro ao criar agente:', error);
      toast.error('Erro ao criar agente', {
        description: 'Verifique os dados e tente novamente',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative z-10">
      <PageHeader
        title="Criar Novo Agente de IA"
        description={`Etapa ${currentStep} de 3: ${WIZARD_STEPS[currentStep - 1].title}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <WizardSteps currentStep={currentStep} steps={WIZARD_STEPS} onStepClick={handleStepClick} />

        <div className="mt-4 mb-16">
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
              onNext={handleSave}
              onBack={handleBack}
            />
          )}
        </div>
      </div>

      {isSaving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-ticlin border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Criando seu agente...</h3>
            <p className="text-sm text-gray-600">Aguarde enquanto configuramos tudo</p>
          </div>
        </div>
      )}
    </div>
  );
}
