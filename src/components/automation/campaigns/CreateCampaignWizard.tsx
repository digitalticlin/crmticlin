
import { useState } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { MessageBuilder } from "./wizard/MessageBuilder";
import { AudienceSelector } from "./wizard/AudienceSelector";
import { ScheduleConfig } from "./wizard/ScheduleConfig";
import { CampaignReview } from "./wizard/CampaignReview";
import { useBroadcastCampaigns } from "@/hooks/broadcast/useBroadcastCampaigns";
import { toast } from "sonner";

interface CreateCampaignWizardProps {
  onSuccess: () => void;
}

const STEPS = [
  { id: 'message', title: 'Mensagem', description: 'Configure o conteúdo da campanha' },
  { id: 'audience', title: 'Público-Alvo', description: 'Selecione os destinatários' },
  { id: 'schedule', title: 'Agendamento', description: 'Configure horários e envio' },
  { id: 'review', title: 'Revisão', description: 'Confirme e crie a campanha' },
];

export const CreateCampaignWizard = ({ onSuccess }: CreateCampaignWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({
    name: '',
    message_text: '',
    media_type: 'text' as const,
    media_url: '',
    message_fragments: [] as string[],
    target: {
      type: 'tags' as const,
      config: {
        tag_ids: [] as string[]
      }
    },
    schedule_type: 'immediate' as const,
    scheduled_at: '',
    rate_limit_per_minute: 2,
    business_hours_only: false,
    time_range: {
      start: '08:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5, 6] // Segunda a sábado
    }
  });
  
  const [isValid, setIsValid] = useState(false);
  const { createCampaign } = useBroadcastCampaigns();
  const [isCreating, setIsCreating] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsCreating(true);
    try {
      const campaign = await createCampaign(campaignData);
      if (campaign) {
        toast.success("Campanha criada com sucesso!");
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error("Erro ao criar campanha");
    } finally {
      setIsCreating(false);
    }
  };

  const updateCampaignData = (updates: Partial<typeof campaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <ModernCard>
        <ModernCardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Criar Nova Campanha</h2>
              <Badge variant="outline">
                Etapa {currentStep + 1} de {STEPS.length}
              </Badge>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between">
              {STEPS.map((step, index) => (
                <div 
                  key={step.id}
                  className={`text-center flex-1 ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    index < currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStep
                      ? 'bg-primary/10 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Step Content */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle>{STEPS[currentStep].title}</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="p-6">
          {currentStep === 0 && (
            <MessageBuilder
              data={campaignData}
              onChange={updateCampaignData}
              onValidChange={setIsValid}
            />
          )}
          
          {currentStep === 1 && (
            <AudienceSelector
              data={campaignData}
              onChange={updateCampaignData}
              onValidChange={setIsValid}
            />
          )}
          
          {currentStep === 2 && (
            <ScheduleConfig
              data={campaignData}
              onChange={updateCampaignData}
              onValidChange={setIsValid}
            />
          )}
          
          {currentStep === 3 && (
            <CampaignReview
              data={campaignData}
              onValidChange={setIsValid}
            />
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isValid}
              className="gap-2"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isCreating}
              className="gap-2"
            >
              {isCreating ? 'Criando...' : 'Criar Campanha'}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
