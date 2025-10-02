import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EditAgent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1 - Básico
    name: "",
    objective: "sales" as "sales" | "support" | "qualification",
    funnel_id: null as string | null,
    whatsapp_number_id: null as string | null,

    // Step 2 - Personalidade
    communication_style: "normal",
    agent_profile: "",
    prohibitions: [] as string[],
    signature: "",

    // Step 3 - Conhecimento
    company_info: "",
    products_services: "",
    faq: [] as { question: string; answer: string }[],
  });

  useEffect(() => {
    if (id) {
      loadAgentData(id);
    }
  }, [id]);

  const loadAgentData = async (agentId: string) => {
    setIsLoading(true);
    try {
      // Load agent basic data
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      // Load agent prompt data
      const { data: prompt, error: promptError } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (promptError && promptError.code !== 'PGRST116') {
        throw promptError;
      }

      setFormData({
        name: agent.name || "",
        objective: agent.type || "sales",
        funnel_id: agent.funnel_id,
        whatsapp_number_id: agent.whatsapp_number_id,
        communication_style: prompt?.communication_style || "normal",
        agent_profile: prompt?.agent_objective || "",
        prohibitions: prompt?.prohibitions || [],
        signature: "",
        company_info: prompt?.company_info || "",
        products_services: prompt?.products_services || "",
        faq: [],
      });
    } catch (error: any) {
      console.error('Erro ao carregar agente:', error);
      toast.error("Erro ao carregar dados do agente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);

    try {
      // 1. Atualizar o agente
      const { error: agentError } = await supabase
        .from('ai_agents')
        .update({
          name: formData.name,
          type: formData.objective,
          funnel_id: formData.funnel_id,
          whatsapp_number_id: formData.whatsapp_number_id,
        })
        .eq('id', id);

      if (agentError) throw agentError;

      // 2. Atualizar ou criar o prompt do agente
      const { error: promptError } = await supabase
        .from('ai_agent_prompts')
        .upsert({
          agent_id: id,
          communication_style: formData.communication_style,
          company_info: formData.company_info,
          products_services: formData.products_services,
          prohibitions: formData.prohibitions,
          rules_guidelines: [],
          client_objections: [],
          flow: []
        }, {
          onConflict: 'agent_id'
        });

      if (promptError) throw promptError;

      toast.success("Agente atualizado com sucesso!");
      navigate('/ai-agents');
    } catch (error: any) {
      console.error('Erro ao atualizar agente:', error);
      toast.error(error.message || "Erro ao atualizar agente");
    } finally {
      setIsSaving(false);
    }
  };

  const backButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/ai-agents')}
      className="h-10 w-10 rounded-lg hover:bg-white/40 transition-all"
    >
      <ArrowLeft className="h-5 w-5 text-gray-900" />
    </Button>
  );

  if (isLoading) {
    return (
      <>
        <PageHeader title="Editar Agente de IA" backButton={backButton} />
        <div className="flex items-center justify-center py-8">
          <p>Carregando dados do agente...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Editar Agente de IA" backButton={backButton} />

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
            <Step3Knowledge data={formData} onChange={handleFieldChange} />
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
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
