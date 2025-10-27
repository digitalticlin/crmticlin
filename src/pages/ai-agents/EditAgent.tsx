import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ai-agents/WizardSteps";
import { Step1Basic } from "@/components/ai-agents/Step1Basic";
import { Step2Personality } from "@/components/ai-agents/Step2Personality";
import { Step3Knowledge } from "@/components/ai-agents/Step3Knowledge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const WIZARD_STEPS = [
  { number: 1, title: 'Configuração', subtitle: '' },
  { number: 2, title: 'Comportamento', subtitle: '' },
  { number: 3, title: 'Informações', subtitle: '' },
];

export default function EditAgent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState(stepFromUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estado inicial para detectar mudanças
  const [initialFormData, setInitialFormData] = useState<any>(null);

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
    communication_style: {
      name: "Normal",
      description: "Use linguagem natural e acessível. Seja cordial sem ser formal demais. Pode usar \"você\" de forma amigável. Evite gírias excessivas, mas pode usar termos cotidianos. Seja claro, direto e mantenha equilíbrio entre profissionalismo e proximidade. Emojis ocasionais são aceitáveis."
    },
    use_emojis: true,
    country: "BR",

    // Step 2 - Personalidade
    agent_function: "",
    prohibitions: [] as string[],
    signature: false,
    knowledge_base_enabled: false,

    // Step 3 - Conhecimento
    company_info: "",
    faq: [] as { question: string; answer: string }[],
  });

  useEffect(() => {
    // Não tentar carregar se o ID for "new"
    if (id && id !== 'new') {
      loadAgentData(id);
    } else if (id === 'new') {
      // Se for "new", redirecionar para criar agente
      toast.error('Use a página de criar agente');
      navigate('/ai-agents/create');
    }
  }, [id, navigate]);

  useEffect(() => {
    const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);
    if (stepFromUrl >= 1 && stepFromUrl <= 3) {
      setCurrentStep(stepFromUrl);
    }
  }, [searchParams]);

  const loadAgentData = async (agentId: string) => {
    setIsLoading(true);
    try {
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      // Parse JSONB fields que vêm como string do banco
      const parseJsonField = (field: any, fallback: any) => {
        if (!field) return fallback;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (error) {
            console.warn('Erro ao fazer parse de campo:', error);
            return fallback;
          }
        }
        return field;
      };

      const objective = parseJsonField(agent.objective, {
        name: "Vendas",
        description: "Seu objetivo é vender. Conduza a conversa para entender a necessidade do cliente, apresente soluções adequadas, contorne objeções de forma persuasiva e trabalhe ativamente para fechar a venda. Seja proativo em oferecer produtos/serviços e criar senso de urgência quando apropriado."
      });

      const communicationStyle = parseJsonField(agent.communication_style, {
        name: "Normal",
        description: "Use linguagem natural e acessível. Seja cordial sem ser formal demais. Pode usar \"você\" de forma amigável. Evite gírias excessivas, mas pode usar termos cotidianos. Seja claro, direto e mantenha equilíbrio entre profissionalismo e proximidade. Emojis ocasionais são aceitáveis."
      });

      const prohibitions = parseJsonField(agent.prohibitions, []);
      const faq = parseJsonField(agent.faq, []);

      // Debug para verificar os valores parseados
      console.log('🔍 Dados carregados:', {
        objective,
        communicationStyle,
        prohibitions: Array.isArray(prohibitions) ? `Array com ${prohibitions.length} itens` : typeof prohibitions,
        faq: Array.isArray(faq) ? `Array com ${faq.length} itens` : typeof faq
      });

      const loadedData = {
        name: agent.name || "",
        objective: objective,
        funnel_id: agent.funnel_id,
        instance_phone: agent.instance_phone || null,
        communication_style: communicationStyle,
        use_emojis: agent.use_emojis !== undefined ? agent.use_emojis : true,
        country: agent.country || "BR",
        agent_function: agent.agent_function || "",
        prohibitions: Array.isArray(prohibitions) ? prohibitions : [],
        signature: agent.signature || false,
        knowledge_base_enabled: agent.knowledge_base_enabled || false,
        company_info: agent.company_info || "",
        faq: Array.isArray(faq) ? faq : [],
      };

      setFormData(loadedData);
      setInitialFormData(loadedData);
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
      console.log('💾 Salvando agente...', {
        id,
        formData: {
          ...formData,
          objective: formData.objective,
          communication_style: formData.communication_style,
          prohibitions: formData.prohibitions,
          faq: formData.faq
        }
      });

      // Preparar dados para salvar - campos JSONB devem ser stringificados
      const dataToSave = {
        name: formData.name,
        objective: JSON.stringify(formData.objective),
        funnel_id: formData.funnel_id,
        instance_phone: formData.instance_phone,
        communication_style: JSON.stringify(formData.communication_style),
        use_emojis: formData.use_emojis,
        country: formData.country,
        agent_function: formData.agent_function,
        prohibitions: JSON.stringify(formData.prohibitions),
        signature: formData.signature,
        knowledge_base_enabled: formData.knowledge_base_enabled,
        company_info: formData.company_info,
        faq: JSON.stringify(formData.faq),
        order_management: formData.objective?.name === 'Montar Pedido',
        updated_at: new Date().toISOString()
      };

      console.log('📤 Dados serializados para envio:', dataToSave);

      const { error: agentError, data: updatedData } = await supabase
        .from('ai_agents')
        .update(dataToSave)
        .eq('id', id)
        .select();

      if (agentError) throw agentError;

      console.log('✅ Agente atualizado:', updatedData);

      toast.success("Agente atualizado com sucesso!");
      navigate('/ai-agents');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar agente:', error);
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
            <Step2Personality data={formData} onChange={handleFieldChange} agentId={id} />
          )}

          {currentStep === 3 && (
            <Step3Knowledge data={formData} onChange={handleFieldChange} agentId={id} />
          )}

          {/* Navigation Buttons - Logo após os cards */}
          <div className="flex justify-between items-center mt-6 relative z-30 max-w-4xl mx-auto">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              onClick={handlePrevious}
              className="h-10 px-4 text-gray-700 hover:bg-white/20 rounded-lg font-medium transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="h-10 px-6 bg-white/40 backdrop-blur-sm border border-white/50 hover:bg-white/60 text-gray-900 font-medium rounded-lg transition-all"
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name}
                className="h-10 px-6 bg-white/40 backdrop-blur-sm border border-white/50 hover:bg-white/60 text-gray-900 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
