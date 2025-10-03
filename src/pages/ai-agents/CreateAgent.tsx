import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ai-agents/WizardSteps";
import { Step1Basic } from "@/components/ai-agents/Step1Basic";
import { Step2Personality } from "@/components/ai-agents/Step2Personality";
import { Step3Knowledge } from "@/components/ai-agents/Step3Knowledge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WIZARD_STEPS = [
  { number: 1, title: 'Básico', subtitle: '' },
  { number: 2, title: 'Personalidade', subtitle: '' },
  { number: 3, title: 'Conhecimento', subtitle: '' },
];

export default function CreateAgent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1 - Básico
    name: "",
    objective: {
      name: "Vendas",
      description: "Seu objetivo é vender. Conduza a conversa para entender a necessidade do cliente, apresente soluções adequadas, contorne objeções de forma persuasiva e trabalhe ativamente para fechar a venda. Seja proativo em oferecer produtos/serviços e criar senso de urgência quando apropriado."
    },
    funnel_id: null as string | null,
    instance_phone: null as string | null,

    // Step 2 - Personalidade
    communication_style: {
      name: "Normal",
      description: "Use linguagem natural e acessível. Seja cordial sem ser formal demais. Pode usar \"você\" de forma amigável. Evite gírias excessivas, mas pode usar termos cotidianos. Seja claro, direto e mantenha equilíbrio entre profissionalismo e proximidade. Emojis ocasionais são aceitáveis."
    },
    agent_function: "",
    prohibitions: [] as string[],
    signature: "",

    // Step 3 - Conhecimento
    company_info: "",
    faq: [] as { question: string; answer: string }[],
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const handleNext = async () => {
    // Se está indo para o step 3 e ainda não criou o agente, criar primeiro
    if (currentStep === 2 && !createdAgentId) {
      await autoSaveAgent();
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const autoSaveAgent = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: newAgent, error: agentError } = await supabase
        .from('ai_agents')
        .insert({
          name: formData.name || 'Novo Agente',
          objective: formData.objective,
          funnel_id: formData.funnel_id,
          instance_phone: formData.instance_phone,
          communication_style: formData.communication_style,
          agent_function: formData.agent_function,
          prohibitions: formData.prohibitions,
          signature: formData.signature,
          company_info: formData.company_info,
          faq: formData.faq,
          flow: {
            flow_metadata: {
              version: "1.0",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            steps: [],
            canvas: {
              nodes: [],
              edges: []
            }
          },
          status: 'inactive',
          created_by_user_id: user.id
        })
        .select('id')
        .single();

      if (agentError) throw agentError;

      if (newAgent?.id) {
        setCreatedAgentId(newAgent.id);
        toast.success("Rascunho do agente salvo!");
      }
    } catch (error: any) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error(error.message || "Erro ao salvar agente");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Se já existe um agente criado (rascunho), atualizar ao invés de inserir
      if (createdAgentId) {
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update({
            name: formData.name,
            objective: formData.objective,
            funnel_id: formData.funnel_id,
            instance_phone: formData.instance_phone,
            communication_style: formData.communication_style,
            agent_function: formData.agent_function,
            prohibitions: formData.prohibitions,
            signature: formData.signature,
            company_info: formData.company_info,
            faq: formData.faq,
            updated_at: new Date().toISOString()
          })
          .eq('id', createdAgentId);

        if (updateError) throw updateError;
      } else {
        // Criar novo agente
        const { error: agentError } = await supabase
          .from('ai_agents')
          .insert({
            name: formData.name,
            objective: formData.objective,
            funnel_id: formData.funnel_id,
            instance_phone: formData.instance_phone,
            communication_style: formData.communication_style,
            agent_function: formData.agent_function,
            prohibitions: formData.prohibitions,
            signature: formData.signature,
            company_info: formData.company_info,
            faq: formData.faq,
            flow: {
              flow_metadata: {
                version: "1.0",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              steps: [],
              canvas: {
                nodes: [],
                edges: []
              }
            },
            status: 'inactive',
            created_by_user_id: user.id
          });

        if (agentError) throw agentError;
      }

      toast.success("Agente salvo com sucesso!");
      navigate('/ai-agents');
    } catch (error: any) {
      console.error('Erro ao salvar agente:', error);
      toast.error(error.message || "Erro ao salvar agente");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Criar Novo Agente de IA"
        backButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ai-agents')}
            className="h-10 w-10 rounded-lg hover:bg-white/40 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <WizardSteps
          currentStep={currentStep}
          steps={WIZARD_STEPS}
          onStepClick={handleStepClick}
        />

        <div className="relative z-20">
          {currentStep === 1 && (
            <Step1Basic data={formData} onChange={handleFieldChange} />
          )}

          {currentStep === 2 && (
            <Step2Personality data={formData} onChange={handleFieldChange} />
          )}

          {currentStep === 3 && (
            <Step3Knowledge data={formData} onChange={handleFieldChange} agentId={createdAgentId || undefined} />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20 relative z-30">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="h-12 px-6 bg-white/40 backdrop-blur-sm border-2 border-white/50 hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="h-12 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200"
              >
                Próximo
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name}
                className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Agente"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
