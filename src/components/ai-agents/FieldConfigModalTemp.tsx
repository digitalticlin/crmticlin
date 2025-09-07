import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamplesManager } from "./ExamplesManager";
import { PhraseTipsManager } from "./PhraseTipsManager";
import { FunnelConfigModal } from "./FunnelConfigModal";
import { Input } from "@/components/ui/input";
import { Plus, Minus, MoveUp, MoveDown } from "lucide-react";
import { AIAgent } from "@/types/aiAgent";
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
  
  // Agent data para o FunnelConfigModal
  agent?: AIAgent | null;
  
  // Configurações
  type: 'simple' | 'with-examples' | 'text-list' | 'objections-list' | 'flow-steps' | 'funnel-config';
  required?: boolean;
}

export const FieldConfigModalTemp = ({
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
  agent,
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



  // Para funnel-config, renderizar apenas o FunnelConfigModal
  if (type === 'funnel-config') {
    return (
      <FunnelConfigModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={async (data) => await onSave(data)}
        title={title}
        icon={icon}
        agent={agent}
      />
    );
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseAttempt();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl flex flex-col">
          <DialogHeader className="border-b border-white/40 pb-4 bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-sm rounded-t-2xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <div className="p-3 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg">
                {icon}
              </div>
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </DialogTitle>
            <p className="text-gray-700 mt-2 text-sm font-medium leading-relaxed">
              ✨ Configure este campo detalhadamente para melhorar o desempenho do seu agente
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <div className="space-y-4 py-4">
                
                {/* Campo Principal - Campos simples e com exemplos */}
                {(type === 'simple' || type === 'with-examples') && fieldKey !== 'phrase_tips' && (
                  <Card className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg border border-white/40 shadow-lg hover:shadow-xl rounded-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50/60 hover:to-white/40 border-l-4 border-l-purple-400">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                        <div className="p-2 bg-purple-500/20 backdrop-blur-sm rounded-lg border border-purple-500/30">
                          {icon}
                        </div>
                        {type === 'simple' ? 'Configuração' : 'Descrição Principal'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {type === 'simple' 
                          ? '📝 Descreva detalhadamente este aspecto do seu agente para otimizar seu desempenho.'
                          : '🎯 Forneça uma descrição geral. Os exemplos ajudarão o agente a entender melhor o contexto.'
                        }
                      </p>
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
                        className="min-h-32 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-purple-500 focus:bg-white/70 rounded-lg transition-all duration-200"
                        rows={6}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Campo Lista de Textos - Regras/Diretrizes e Proibições */}
                {type === 'text-list' && (
                  <Card className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg border border-white/40 shadow-lg hover:shadow-xl rounded-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-yellow-50/60 hover:to-white/40 border-l-4 border-l-yellow-400">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                        <div className="p-2 bg-yellow-500/20 backdrop-blur-sm rounded-lg border border-yellow-500/30">
                          {icon}
                        </div>
                        Lista de Itens
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        💡 Adicione itens à lista. Cada item será uma regra ou diretriz específica para orientar seu agente.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {textListData.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 group bg-white/30 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:border-yellow-300/50 hover:bg-white/40 transition-all duration-200">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newData = [...textListData];
                                newData[index] = e.target.value;
                                setTextListData(newData);
                              }}
                              placeholder="Digite o item aqui..."
                              className="bg-white/50 backdrop-blur-sm border border-white/30 focus:border-yellow-500 focus:bg-white/70 transition-all duration-200 rounded-lg"
                            />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newData = textListData.filter((_, i) => i !== index);
                                  setTextListData(newData);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all duration-200"
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
                        className="w-full h-12 border-2 border-dashed border-yellow-300/50 hover:border-yellow-400 hover:bg-gradient-to-r hover:from-yellow-50/70 hover:to-yellow-100/50 text-yellow-700 hover:text-yellow-800 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm bg-white/20"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Novo Item
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Campo Objeções */}
                {type === 'objections-list' && (
                  <Card className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg border border-white/40 shadow-lg hover:shadow-xl rounded-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50/60 hover:to-white/40 border-l-4 border-l-blue-400">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                        <div className="p-2 bg-blue-500/20 backdrop-blur-sm rounded-lg border border-blue-500/30">
                          {icon}
                        </div>
                        Objeções e Respostas
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        🎯 Configure objeções comuns dos clientes e as melhores respostas para cada situação.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {objectionsData.map((objection, index) => (
                        <div key={index} className="bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30 group hover:border-blue-300/50 hover:from-white/40 hover:to-white/30 transition-all duration-200">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                  Objeção do Cliente
                                </label>
                                <Input
                                  value={objection.objection}
                                  onChange={(e) => {
                                    const newData = [...objectionsData];
                                    newData[index] = { ...objection, objection: e.target.value };
                                    setObjectionsData(newData);
                                  }}
                                  placeholder="Ex: 'É muito caro'"
                                  className="bg-white/50 backdrop-blur-sm border border-white/30 focus:border-blue-500 focus:bg-white/70 transition-all duration-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  Resposta Sugerida
                                </label>
                                <Textarea
                                  value={objection.response}
                                  onChange={(e) => {
                                    const newData = [...objectionsData];
                                    newData[index] = { ...objection, response: e.target.value };
                                    setObjectionsData(newData);
                                  }}
                                  placeholder="Digite a melhor resposta para esta objeção..."
                                  className="bg-white/50 backdrop-blur-sm border border-white/30 focus:border-blue-500 focus:bg-white/70 transition-all duration-200 rounded-lg"
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newData = objectionsData.filter((_, i) => i !== index);
                                  setObjectionsData(newData);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all duration-200"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setObjectionsData([...objectionsData, { objection: '', response: '' }])}
                        className="w-full h-12 border-2 border-dashed border-blue-300/50 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-blue-100/50 text-blue-700 hover:text-blue-800 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm bg-white/20"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Nova Objeção
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Campo Passos do Fluxo */}
                {type === 'flow-steps' && (
                  <Card className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg border border-white/40 shadow-lg hover:shadow-xl rounded-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-green-50/60 hover:to-white/40 border-l-4 border-l-green-400">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                        <div className="p-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30">
                          {icon}
                        </div>
                        Passo a Passo do Atendimento
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        📋 Configure a sequência ordenada de passos que o agente deve seguir durante o atendimento.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {flowStepsData.map((step, index) => (
                        <div key={index} className="bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30 group hover:border-green-300/50 hover:from-white/40 hover:to-white/30 transition-all duration-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white font-bold rounded-full flex items-center justify-center text-sm mt-1 shadow-sm">
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
                                className="bg-white/50 backdrop-blur-sm border border-white/30 focus:border-green-500 focus:bg-white/70 transition-all duration-200 rounded-lg"
                                rows={2}
                              />
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
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
                                  className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-all duration-200"
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
                                  className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-all duration-200"
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
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all duration-200"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFlowStepsData([...flowStepsData, ''])}
                        className="w-full h-12 border-2 border-dashed border-green-300/50 hover:border-green-400 hover:bg-gradient-to-r hover:from-green-50/70 hover:to-green-100/50 text-green-700 hover:text-green-800 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm bg-white/20"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Novo Passo
                      </Button>
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
          <div className="flex-shrink-0 flex justify-end gap-4 pt-6 border-t border-white/40 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
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
              className="px-6 h-12 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-300 hover:scale-105 font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <Button 
              onClick={handleSave}
              data-save-button
              className="px-8 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmation} onOpenChange={() => setShowConfirmation(false)}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-white/40 pb-4 bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-sm rounded-t-2xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              Alterações não salvas
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              ⚠️ Tem certeza que deseja sair sem salvar? Todas as alterações feitas serão perdidas.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-white/40 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelClose}
              className="px-5 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-300 hover:scale-105 font-medium"
            >
              Continuar editando
            </Button>
            <Button 
              onClick={handleConfirmClose}
              className="px-5 h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Sair sem salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};