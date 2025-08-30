import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamplesManager } from "./ExamplesManager";
import { PhraseTipsManager } from "./PhraseTipsManager";
import { Input } from "@/components/ui/input";
import { Plus, Minus, MoveUp, MoveDown } from "lucide-react";
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
  
  // Para campos com lista de textos
  textListValue?: string[];
  
  // Para campos com objeções
  objectionsValue?: Array<{objection: string; response: string}>;
  
  // Para campos com passos do fluxo
  flowStepsValue?: string[];
  
  // Para campos de configuração do funil
  funnelConfigValue?: any[];
  
  // Configurações
  type: 'simple' | 'with-examples' | 'text-list' | 'objections-list' | 'flow-steps' | 'funnel-config';
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
  textListValue,
  objectionsValue,
  flowStepsValue,
  funnelConfigValue,
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
  
  // Estados para campos de lista de textos
  const [textListData, setTextListData] = useState<string[]>(textListValue || []);
  
  // Estados para campos de objeções
  const [objectionsData, setObjectionsData] = useState<Array<{objection: string; response: string}>>(
    objectionsValue || []
  );
  
  // Estados para passos do fluxo
  const [flowStepsData, setFlowStepsData] = useState<string[]>(flowStepsValue || []);
  
  // Estados para configuração do funil
  const [funnelConfigData, setFunnelConfigData] = useState<any[]>(funnelConfigValue || []);

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
    } else if (type === 'with-examples') {
      return (
        complexData.description !== initialComplexValue.description ||
        JSON.stringify(complexData.examples) !== JSON.stringify(initialComplexValue.examples)
      );
    } else if (type === 'text-list') {
      return JSON.stringify(textListData) !== JSON.stringify(textListValue || []);
    } else if (type === 'objections-list') {
      return JSON.stringify(objectionsData) !== JSON.stringify(objectionsValue || []);
    } else if (type === 'flow-steps') {
      return JSON.stringify(flowStepsData) !== JSON.stringify(flowStepsValue || []);
    } else if (type === 'funnel-config') {
      return JSON.stringify(funnelConfigData) !== JSON.stringify(funnelConfigValue || []);
    }
    return false;
  }, [type, simpleData, complexData, textListData, objectionsData, flowStepsData, funnelConfigData, initialSimpleValue, initialComplexValue, textListValue, objectionsValue, flowStepsValue, funnelConfigValue]);

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
      setTextListData(textListValue || []);
      setObjectionsData(objectionsValue || []);
      setFlowStepsData(flowStepsValue || []);
      setFunnelConfigData(funnelConfigValue || []);
      setShowConfirmation(false);
    }
  }, [isOpen, simpleValue, fieldWithExamples, textListValue, objectionsValue, flowStepsValue, funnelConfigValue]);



  const handleSave = async () => {
    console.log('💾 FieldConfigModal - handleSave chamado');
    
    let valueToSave;
    
    if (type === 'simple') {
      // Permitir salvar campos vazios - remover validação obrigatória
      valueToSave = simpleData;
    } else if (type === 'with-examples') {
      // Permitir salvar campos vazios - remover validação obrigatória
      valueToSave = complexData;
    } else if (type === 'text-list') {
      valueToSave = textListData;
    } else if (type === 'objections-list') {
      valueToSave = objectionsData;
    } else if (type === 'flow-steps') {
      valueToSave = flowStepsData;
    } else if (type === 'funnel-config') {
      valueToSave = funnelConfigData;
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
    setTextListData(textListValue || []);
    setObjectionsData(objectionsValue || []);
    setFlowStepsData(flowStepsValue || []);
    setFunnelConfigData(funnelConfigValue || []);
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
                
                {/* Campo Principal - Campos simples e com exemplos */}
                {(type === 'simple' || type === 'with-examples') && fieldKey !== 'phrase_tips' && (
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
                
                {/* Campo Lista de Textos - Regras/Diretrizes e Proibições */}
                {type === 'text-list' && (
                  <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        {icon}
                        Lista de Itens
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Adicione itens à lista. Cada item será uma regra ou diretriz específica.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {textListData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <div className="flex-1">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newData = [...textListData];
                                newData[index] = e.target.value;
                                setTextListData(newData);
                              }}
                              placeholder="Digite o item aqui..."
                              className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500"
                            />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newData = textListData.filter((_, i) => i !== index);
                                  setTextListData(newData);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTextListData([...textListData, ''])}
                        className="w-full h-10 border-dashed border-gray-300 hover:border-yellow-500 hover:bg-yellow-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Campo Objeções */}
                {type === 'objections-list' && (
                  <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        {icon}
                        Objeções e Respostas
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure objeções comuns dos clientes e as melhores respostas.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {objectionsData.map((objection, index) => (
                        <div key={index} className="bg-white/20 p-4 rounded-lg border border-white/20 group">
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Objeção do Cliente:
                              </label>
                              <Input
                                value={objection.objection}
                                onChange={(e) => {
                                  const newData = [...objectionsData];
                                  newData[index] = { ...objection, objection: e.target.value };
                                  setObjectionsData(newData);
                                }}
                                placeholder="Ex: 'É muito caro'"
                                className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Resposta Sugerida:
                              </label>
                              <Textarea
                                value={objection.response}
                                onChange={(e) => {
                                  const newData = [...objectionsData];
                                  newData[index] = { ...objection, response: e.target.value };
                                  setObjectionsData(newData);
                                }}
                                placeholder="Digite a melhor resposta para esta objeção..."
                                className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500"
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newData = objectionsData.filter((_, i) => i !== index);
                                    setObjectionsData(newData);
                                  }}
                                  className="text-red-600 hover:bg-red-100"
                                >
                                  <Minus className="h-4 w-4 mr-1" />
                                  Remover
                                </Button>
                              </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setObjectionsData([...objectionsData, { objection: '', response: '' }])}
                        className="w-full h-10 border-dashed border-gray-300 hover:border-yellow-500 hover:bg-yellow-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Objeção
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Campo Passos do Fluxo */}
                {type === 'flow-steps' && (
                  <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        {icon}
                        Passo a Passo do Atendimento
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure a sequência de passos que o agente deve seguir durante o atendimento.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {flowStepsData.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 group">
                          <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center text-sm mt-1">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <Textarea
                              value={step}
                              onChange={(e) => {
                                const newData = [...flowStepsData];
                                newData[index] = e.target.value;
                                setFlowStepsData(newData);
                              }}
                              placeholder={`Descreva o passo ${index + 1} do atendimento...`}
                              className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500"
                              rows={2}
                            />
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newData = [...flowStepsData];
                                  [newData[index], newData[index - 1]] = [newData[index - 1], newData[index]];
                                  setFlowStepsData(newData);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                            )}
                            {index < flowStepsData.length - 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newData = [...flowStepsData];
                                  [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
                                  setFlowStepsData(newData);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newData = flowStepsData.filter((_, i) => i !== index);
                                  setFlowStepsData(newData);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFlowStepsData([...flowStepsData, ''])}
                        className="w-full h-10 border-dashed border-gray-300 hover:border-yellow-500 hover:bg-yellow-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Passo
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Campo Configuração do Funil */}
                {type === 'funnel-config' && (
                  <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        {icon}
                        Configuração do Funil
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure como o agente deve interagir com o funil de vendas.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-700 font-medium">
                          🚧 Esta funcionalidade será implementada em breve.
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          A configuração do funil permitirá definir como o agente move leads através das etapas do funil.
                        </p>
                      </div>
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