import { useState } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  MessageSquare, 
  Users, 
  Clock, 
  Eye,
  CheckCircle
} from "lucide-react";
import { ModernMediaUploader } from "./ModernMediaUploader";
import { ModernMessageFragmenter } from "./ModernMessageFragmenter";
import { ModernTagSelector } from "./ModernTagSelector";
import { ModernInstanceSelector } from "./ModernInstanceSelector";
import { ModernScheduleConfig } from "./ModernScheduleConfig";
import { toast } from "sonner";

interface ModernCampaignCreatorProps {
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: "Configuração", icon: MessageSquare },
  { id: 2, title: "Mensagem", icon: MessageSquare },
  { id: 3, title: "Público-alvo", icon: Users },
  { id: 4, title: "Agendamento", icon: Clock },
  { id: 5, title: "Revisar", icon: Eye }
];

export function ModernCampaignCreator({ onSuccess }: ModernCampaignCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    instanceId: "",
    message: "",
    mediaFile: null as File | null,
    mediaType: "text" as "text" | "image" | "video" | "audio" | "document",
    fragments: [] as any[],
    selectedTags: [] as string[],
    schedule: {
      type: "immediate" as "immediate" | "scheduled",
      businessHours: false,
      startHour: 8,
      endHour: 18,
      weekDays: [1, 2, 3, 4, 5],
      rateLimit: 2
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCampaignData = (updates: Partial<typeof campaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name.trim() && campaignData.instanceId;
      case 2:
        return campaignData.message.trim() || campaignData.mediaFile;
      case 3:
        return true; // Público-alvo é opcional (todos os leads)
      case 4:
        return true; // Agendamento sempre válido
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Campanha criada com sucesso!", {
        description: `"${campaignData.name}" foi configurada e está pronta para execução.`
      });
      
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao criar campanha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6 pb-6">
      {/* Progress Steps - Sticky no topo */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg rounded-2xl border border-white/30 shadow-glass">
        <ModernCard className="shadow-none border-none bg-transparent">
          <ModernCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Criar Nova Campanha</h2>
              <span className="text-sm text-muted-foreground">
                Etapa {currentStep} de {STEPS.length}
              </span>
            </div>
            
            <Progress value={progress} className="mb-6 h-2" />
            
            <div className="flex justify-between">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
                      ${isActive ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 'bg-white/20 text-gray-400'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs ${isActive || isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>

      {/* Step Content - Scrollable */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle>
            {STEPS[currentStep - 1]?.title}
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="p-6 space-y-6 min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input
                  placeholder="Ex: Promoção de fim de semana"
                  value={campaignData.name}
                  onChange={(e) => updateCampaignData({ name: e.target.value })}
                  className="bg-white/50 border-white/20"
                />
              </div>
              
              <ModernInstanceSelector
                selectedInstanceId={campaignData.instanceId}
                onInstanceSelect={(instanceId) => updateCampaignData({ instanceId })}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <ModernMediaUploader
                onMediaSelect={(file, type) => updateCampaignData({ mediaFile: file, mediaType: type })}
                selectedFile={campaignData.mediaFile}
                mediaType={campaignData.mediaType}
                message={campaignData.message}
                onMessageChange={(message) => updateCampaignData({ message })}
              />
              
              {campaignData.message && (
                <ModernMessageFragmenter
                  initialMessage={campaignData.message}
                  onFragmentsChange={(fragments) => updateCampaignData({ fragments })}
                />
              )}
            </div>
          )}

          {currentStep === 3 && (
            <ModernTagSelector
              selectedTags={campaignData.selectedTags}
              onTagsChange={(selectedTags) => updateCampaignData({ selectedTags })}
            />
          )}

          {currentStep === 4 && (
            <ModernScheduleConfig
              config={campaignData.schedule}
              onConfigChange={(schedule) => updateCampaignData({ schedule })}
            />
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg p-6">
                <h3 className="font-semibold mb-4 text-blue-900">Resumo da Campanha</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-sm text-blue-700">Nome:</span>
                    <p className="font-medium text-blue-900">{campaignData.name}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-blue-700">Tipo de mídia:</span>
                    <p className="font-medium text-blue-900 capitalize">{campaignData.mediaType}</p>
                  </div>

                  <div>
                    <span className="text-sm text-blue-700">Fragmentos:</span>
                    <p className="font-medium text-blue-900">
                      {campaignData.fragments.length > 0 ? `${campaignData.fragments.length} parte(s)` : '1 parte'}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-blue-700">Agendamento:</span>
                    <p className="font-medium text-blue-900">
                      {campaignData.schedule.type === 'immediate' ? 'Imediato' : 'Agendado'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <span className="text-sm text-blue-700">Prévia da mensagem:</span>
                  <p className="text-sm text-blue-900 mt-1">{campaignData.message || 'Apenas mídia'}</p>
                </div>
              </div>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Navigation - Sticky no final */}
      <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-lg rounded-2xl border border-white/30 shadow-glass p-6">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="bg-white/20 border-white/20 hover:bg-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Criar Campanha
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
