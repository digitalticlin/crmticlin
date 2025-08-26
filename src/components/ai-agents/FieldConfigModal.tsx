import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamplesManager } from "./ExamplesManager";
import { PhraseTipsManager } from "./PhraseTipsManager";
import { PQExample, FieldWithExamples } from "@/types/aiAgent";
import { Save, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  fieldKey: string;
  icon: React.ReactNode;
  
  // Para campos simples
  simpleValue?: string;
  placeholder?: string;
  
  // Para campos com exemplos
  fieldWithExamples?: FieldWithExamples;
  examplePlaceholder?: {
    question: string;
    answer: string;
  };
  
  // Configurações
  type: 'simple' | 'with-examples';
  required?: boolean;
}

export const FieldConfigModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  fieldKey,
  icon,
  simpleValue = "",
  placeholder = "",
  fieldWithExamples,
  examplePlaceholder,
  type,
  required = false
}: FieldConfigModalProps) => {
  // Estados para campo simples
  const [simpleData, setSimpleData] = useState(simpleValue);
  
  // Estados para campo com exemplos
  const [complexData, setComplexData] = useState<FieldWithExamples>(
    fieldWithExamples || {
      description: "",
      examples: []
    }
  );

  // Estados para controle de confirmação
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Controlar mount/unmount para evitar atualizações após desmontagem
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Valores iniciais para comparação
  const initialSimpleValue = simpleValue;
  const initialComplexValue = fieldWithExamples || { description: "", examples: [] };

  // Detectar se há mudanças não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (type === 'simple') {
      return simpleData !== initialSimpleValue;
    } else {
      return (
        complexData.description !== initialComplexValue.description ||
        JSON.stringify(complexData.examples) !== JSON.stringify(initialComplexValue.examples)
      );
    }
  }, [type, simpleData, complexData, initialSimpleValue, initialComplexValue]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log(`🔧 FieldConfigModal aberto para campo: ${fieldKey}`);
      console.log('📊 Valores recebidos:', {
        type,
        simpleValue: simpleValue ? `PREENCHIDO (${simpleValue.length} chars)` : 'VAZIO',
        fieldWithExamples: fieldWithExamples ? {
          description: fieldWithExamples.description ? `PREENCHIDO (${fieldWithExamples.description.length} chars)` : 'VAZIO',
          examples: fieldWithExamples.examples?.length || 0
        } : 'NENHUM'
      });
      
      setSimpleData(simpleValue);
      setComplexData(fieldWithExamples || { description: "", examples: [] });
      setShowConfirmation(false);
    }
  }, [isOpen, simpleValue, fieldWithExamples]);



  const handleSave = async () => {
    console.log('💾 FieldConfigModal - handleSave chamado');
    
    let valueToSave;
    
    if (type === 'simple') {
      // Permitir salvar campos vazios - remover validação obrigatória
      valueToSave = simpleData;
    } else {
      // Permitir salvar campos vazios - remover validação obrigatória
      valueToSave = complexData;
    }
    
    console.log('📝 Salvando valor:', valueToSave);
    
    try {
      // Chama onSave passado pelo componente pai
      await onSave(valueToSave);
      console.log('✅ FieldConfigModal - Dados salvos com sucesso');
      
      // Feedback visual de sucesso
      const button = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✅ Salvo!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
      
      // Modal fecha automaticamente após salvamento bem-sucedido para melhor UX
      // Aguardar um pouco para feedback visual e depois fechar
      setTimeout(() => {
        if (isMounted) {
          console.log('🚪 Fechando modal automaticamente após salvamento bem-sucedido');
          handleForceClose();
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao salvar no FieldConfigModal:', error);
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar a configuração. Verifique os dados e tente novamente.',
      });
    }
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowConfirmation(true);
    } else {
      handleForceClose();
    }
  };

  const handleForceClose = () => {
    // Reset states
    setSimpleData(simpleValue);
    setComplexData(fieldWithExamples || { description: "", examples: [] });
    setShowConfirmation(false);
    onClose();
  };

  const handleConfirmClose = () => {
    setShowConfirmation(false);
    handleForceClose();
  };

  const handleCancelClose = () => {
    setShowConfirmation(false);
  };



  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseAttempt();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl flex flex-col">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <div className="p-2 bg-white/30 backdrop-blur-sm rounded-lg border border-white/40 shadow-glass">
                {icon}
              </div>
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </DialogTitle>
            <p className="text-gray-700 mt-1 text-sm font-medium">
              Configure este campo detalhadamente para melhorar o desempenho do seu agente
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <div className="space-y-4 py-4">
                
                {/* Campo Principal - Não mostrar para dicas de frases */}
                {fieldKey !== 'phrase_tips' && (
                  <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        {icon}
                        {type === 'simple' ? 'Configuração' : 'Descrição Principal'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={type === 'simple' ? simpleData : complexData.description}
                        onChange={(e) => {
                          if (type === 'simple') {
                            setSimpleData(e.target.value);
                          } else {
                            setComplexData(prev => ({ ...prev, description: e.target.value }));
                          }
                        }}
                        placeholder={placeholder}
                        className="min-h-32 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                        rows={6}
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        {type === 'simple' 
                          ? 'Descreva detalhadamente este aspecto do seu agente.'
                          : 'Forneça uma descrição geral. Os exemplos ajudarão o agente a entender melhor.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Seção de Exemplos (apenas para campos complexos) */}
              {type === 'with-examples' && (
                fieldKey === 'phrase_tips' ? (
                  <PhraseTipsManager
                    examples={complexData.examples}
                    onChange={(examples) => setComplexData(prev => ({ ...prev, examples }))}
                    title="Frases e Contextos"
                  />
                ) : (
                  <ExamplesManager
                    examples={complexData.examples}
                    onChange={(examples) => setComplexData(prev => ({ ...prev, examples }))}
                    title="Exemplos"
                    placeholder={examplePlaceholder}
                  />
                )
              )}
            </div>
          </div>

          {/* Footer com botões - sempre visível */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (hasUnsavedChanges) {
                  setShowConfirmation(true);
                } else {
                  handleForceClose();
                }
              }}
              className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <Button 
              onClick={handleSave}
              data-save-button
              className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmation} onOpenChange={() => setShowConfirmation(false)}>
        <DialogContent className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <div className="p-2 bg-yellow-500/20 backdrop-blur-sm rounded-lg border border-yellow-500/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              Alterações não salvas
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              Tem certeza que deseja sair sem salvar? Todas as alterações feitas serão perdidas.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelClose}
              className="px-4 h-10 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg transition-all duration-200"
            >
              Continuar editando
            </Button>
            <Button 
              onClick={handleConfirmClose}
              className="px-4 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200"
            >
              Sair sem salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};