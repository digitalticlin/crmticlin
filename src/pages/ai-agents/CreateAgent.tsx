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

export default function CreateAgent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  // Estados para modal de confirmação
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);

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
    signature: false,
    knowledge_base_enabled: false,

    // Step 3 - Conhecimento
    company_info: "",
    faq: [] as { question: string; answer: string }[],
  });

  // Estado inicial para detectar mudanças
  const [initialFormData] = useState(formData);

  // Detectar mudanças não salvas
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialFormData]);

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

      // Preparar dados para salvar - campos JSONB devem ser stringificados
      const dataToSave = {
        name: formData.name || 'Novo Agente',
        objective: JSON.stringify(formData.objective),
        funnel_id: formData.funnel_id,
        instance_phone: formData.instance_phone,
        communication_style: JSON.stringify(formData.communication_style),
        agent_function: formData.agent_function,
        prohibitions: JSON.stringify(formData.prohibitions),
        signature: formData.signature,
        knowledge_base_enabled: formData.knowledge_base_enabled,
        company_info: formData.company_info,
        faq: JSON.stringify(formData.faq),
        flow: JSON.stringify({
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
        }),
        status: 'inactive',
        created_by_user_id: user.id
      };

      const { data: newAgent, error: agentError } = await supabase
        .from('ai_agents')
        .insert(dataToSave)
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

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      navigate('/ai-agents');
    }
  };

  const handleSave = async (shouldNavigate: boolean = true) => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Preparar dados para salvar - campos JSONB devem ser stringificados
      const dataToSave = {
        name: formData.name,
        objective: JSON.stringify(formData.objective),
        funnel_id: formData.funnel_id,
        instance_phone: formData.instance_phone,
        communication_style: JSON.stringify(formData.communication_style),
        agent_function: formData.agent_function,
        prohibitions: JSON.stringify(formData.prohibitions),
        signature: formData.signature,
        knowledge_base_enabled: formData.knowledge_base_enabled,
        company_info: formData.company_info,
        faq: JSON.stringify(formData.faq),
        updated_at: new Date().toISOString()
      };

      // Se já existe um agente criado (rascunho), atualizar ao invés de inserir
      if (createdAgentId) {
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update(dataToSave)
          .eq('id', createdAgentId);

        if (updateError) throw updateError;
      } else {
        // Criar novo agente
        const { error: agentError } = await supabase
          .from('ai_agents')
          .insert({
            ...dataToSave,
            flow: JSON.stringify({
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
            }),
            status: 'inactive',
            created_by_user_id: user.id
          });

        if (agentError) throw agentError;
      }

      toast.success("Agente salvo com sucesso!");
      setHasUnsavedChanges(false);

      if (shouldNavigate) {
        navigate('/ai-agents');
      }
    } catch (error: any) {
      console.error('Erro ao salvar agente:', error);
      toast.error(error.message || "Erro ao salvar agente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExitWithoutSaving = () => {
    setShowExitDialog(false);
    navigate('/ai-agents');
  };

  const handleSaveAndExit = async () => {
    setShowExitDialog(false);
    await handleSave(true);
  };

  return (
    <>
      <PageHeader
        title="Criar Novo Agente de IA"
        backButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
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
            <Step2Personality data={formData} onChange={handleFieldChange} agentId={createdAgentId || undefined} />
          )}

          {currentStep === 3 && (
            <Step3Knowledge data={formData} onChange={handleFieldChange} agentId={createdAgentId || undefined} />
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
            {/* Botão Salvar - presente em todas as etapas */}
            <Button
              onClick={() => handleSave(false)}
              disabled={isSaving || !formData.name}
              className="h-10 px-6 bg-white/20 hover:bg-white/30 border border-white/40 text-gray-900 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>

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
                onClick={() => handleSave(true)}
                disabled={isSaving || !formData.name}
                className="h-10 px-6 bg-white/40 backdrop-blur-sm border border-white/50 hover:bg-white/60 text-gray-900 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar e Sair
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação ao sair */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja salvar as alterações antes de sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleExitWithoutSaving}>
              Sair sem salvar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndExit}>
              Salvar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
