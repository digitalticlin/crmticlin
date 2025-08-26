import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamplesManager } from "./ExamplesManager";
import { FlowStepEnhanced } from "@/types/aiAgent";
import { Save, X, ListChecks } from "lucide-react";
import { toast } from "sonner";

interface FlowStepConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: FlowStepEnhanced) => void;
  step: FlowStepEnhanced | null;
  stepNumber: number;
}

export const FlowStepConfigModal = ({
  isOpen,
  onClose,
  onSave,
  step,
  stepNumber
}: FlowStepConfigModalProps) => {
  console.log('🏗️ FlowStepConfigModal renderizado:', { isOpen, step, stepNumber });
  console.log('🚪 FlowStepConfigModal Dialog.open será:', isOpen);
  const [stepData, setStepData] = useState<FlowStepEnhanced>(
    step || {
      id: `step_${Date.now()}`,
      description: "",
      examples: [],
      order: stepNumber
    }
  );

  // Atualizar stepData quando step prop mudar
  useEffect(() => {
    console.log('🔄 useEffect disparado - step mudou:', step);
    if (step) {
      console.log('🔄 Atualizando stepData com:', step);
      setStepData(step);
    }
  }, [step]);

  const handleSave = async () => {
    if (!stepData.description.trim()) {
      toast.error('Descrição obrigatória', {
        description: 'Por favor, descreva o que o agente deve fazer neste passo.',
      });
      return;
    }
    
    try {
      await onSave({
        ...stepData,
        order: stepNumber
      });
      
      // Feedback visual de sucesso
      const button = document.querySelector('[data-save-step-button]') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✅ Passo Salvo!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
      
      console.log('✅ Passo salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar passo:', error);
      toast.error('Erro ao salvar passo', {
        description: 'Não foi possível salvar o passo. Verifique os dados e tente novamente.',
      });
    }
  };

  const handleClose = () => {
    // Reset state
    setStepData(step || {
      id: `step_${Date.now()}`,
      description: "",
      examples: [],
      order: stepNumber
    });
    onClose();
  };



  return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        console.log('🚪 Dialog onOpenChange chamado:', open);
        if (!open) {
          handleClose();
        }
      }}>
        {console.log('🚪 Renderizando Dialog com open:', isOpen)}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl flex flex-col">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <div className="p-2 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40 shadow-glass">
                <ListChecks className="h-5 w-5 text-gray-800" />
              </div>
              Configurar Passo {stepNumber}
              <span className="text-red-500 ml-1">*</span>
            </DialogTitle>
            <p className="text-gray-700 mt-1 text-sm font-medium">
              Defina o que o agente deve fazer neste passo e forneça exemplos práticos
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <div className="space-y-4 py-4">
                
                {/* Descrição do Passo */}
                <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                      <div className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center justify-center">
                        {stepNumber}
                      </div>
                      Descrição do Passo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={stepData.description}
                      onChange={(e) => setStepData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={`Ex: Passo ${stepNumber}: Se apresentar ao cliente, perguntar o nome e identificar a necessidade principal`}
                      className="min-h-32 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                      rows={6}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Descreva claramente o que o agente deve fazer neste passo do atendimento.
                    </p>
                  </CardContent>
                </Card>

              {/* Exemplos para este passo */}
              <ExamplesManager
                examples={stepData.examples}
                onChange={(examples) => setStepData(prev => ({ ...prev, examples }))}
                title={`Exemplos para o Passo ${stepNumber}`}
                placeholder={{
                  question: `Ex: Pergunta típica no passo ${stepNumber}`,
                  answer: `Ex: Como o agente deve responder no passo ${stepNumber}`
                }}
              />
            </div>
          </div>

          {/* Footer com botões - sempre visível */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <Button 
              onClick={handleSave}
              data-save-step-button
              className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Passo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
};