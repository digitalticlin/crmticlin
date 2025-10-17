import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronDown, ChevronUp, Plus, X, GitBranch, Package, Workflow, GraduationCap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QAPair {
  question: string;
  answer: string;
}

interface Step3KnowledgeProps {
  data: {
    faq: QAPair[];
    knowledge_base_enabled: boolean;
    company_info?: string;
  };
  onChange: (field: string, value: any) => void;
  agentId?: string;
}

export const Step3Knowledge = ({ data, onChange, agentId }: Step3KnowledgeProps) => {
  const navigate = useNavigate();
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (agentId) {
      loadProductCount();
    }
  }, [agentId]);

  const loadProductCount = async () => {
    if (!agentId) return;
    const { count } = await supabase
      .from('ai_agent_products')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);
    setProductCount(count || 0);
  };

  const handleAddFaq = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      if (editingIndex !== null) {
        const updated = [...data.faq];
        updated[editingIndex] = { question: newQuestion.trim(), answer: newAnswer.trim() };
        onChange('faq', updated);
        setEditingIndex(null);
      } else {
        onChange('faq', [...data.faq, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
      }
      setNewQuestion("");
      setNewAnswer("");
    }
  };

  const handleEditFaq = (index: number) => {
    const item = data.faq[index];
    setNewQuestion(item.question);
    setNewAnswer(item.answer);
    setEditingIndex(index);
  };

  const handleRemoveFaq = (index: number) => {
    const updated = data.faq.filter((_, i) => i !== index);
    onChange('faq', updated);
  };

  const handleFlowBuilder = () => {
    if (!agentId) {
      console.error('⚠️ Agent ID não disponível');
      return;
    }
    navigate(`/ai-agents/flow-builder/${agentId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-20">
      {/* FAQ */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setFaqExpanded(!faqExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 shadow-md">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-bold text-gray-900 cursor-pointer">
                  Perguntas Frequentes (Opcional)
                </Label>
                <p className="text-xs text-gray-600">
                  {data.faq.length > 0 ? `${data.faq.length} perguntas cadastradas` : 'Adicione as perguntas que seus clientes mais fazem, e um exemplo de resposta para a IA'}
                </p>
              </div>
            </div>
            {faqExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {faqExpanded && (
            <div className="mt-4 space-y-3">
              {/* Formulário de Adição */}
              <div className="space-y-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ex: Qual o horário de funcionamento?"
                  className="h-12 text-base bg-white/40 border border-white/40 focus:border-orange-500 focus:bg-white/50 rounded-xl transition-all"
                />
                <Textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Ex: Nosso horário é de segunda a sexta, das 8h às 18h"
                  className="min-h-[80px] text-base bg-white/40 border border-white/40 focus:border-orange-500 focus:bg-white/50 rounded-xl transition-all"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddFaq}
                    className="flex-1 h-10 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  {editingIndex !== null && (
                    <Button
                      onClick={() => {
                        setEditingIndex(null);
                        setNewQuestion("");
                        setNewAnswer("");
                      }}
                      variant="ghost"
                      className="h-10 hover:bg-white/40 rounded-lg"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de P&R */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto kanban-column-scrollbar">
                {data.faq.map((item, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-white/20 border border-white/30 rounded-lg transition-all hover:bg-white/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm mb-1 flex items-center gap-2">
                          <span>💬</span>
                          {item.question}
                        </p>
                        <p className="text-xs text-gray-700 pl-6">
                          {item.answer}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-3 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFaq(index)}
                          className="h-7 w-7 p-0 hover:bg-white/40 rounded-lg"
                          title="Editar"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFaq(index)}
                          className="h-7 w-7 p-0 hover:bg-white/40 rounded-lg"
                          title="Remover"
                        >
                          <X className="h-3.5 w-3.5 text-gray-700" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {data.faq.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-4">
                    Nenhuma pergunta cadastrada. Clique em "Adicionar" para criar.
                  </p>
                )}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Card: Base de Conhecimento */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-base font-bold text-gray-900">
                    Base de Conhecimento (Opcional)
                  </Label>
                  <p className="text-xs text-gray-600">
                    Se você tem muitos produtos ou serviços diferentes, adicione na base de conhecimento
                  </p>
                </div>
              </div>
              <Switch
                checked={data.knowledge_base_enabled || false}
                onCheckedChange={(value) => onChange('knowledge_base_enabled', value)}
              />
            </div>

            {data.knowledge_base_enabled && agentId && (
              <Button
                type="button"
                onClick={() => navigate(`/ai-agents/${agentId}/base-conhecimento`)}
                className="w-full h-10 bg-white/40 backdrop-blur-sm border border-white/50 hover:bg-white/60 text-gray-900 font-medium rounded-lg transition-all"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                {productCount > 0 ? `Editar Base (${productCount} ${productCount === 1 ? 'item' : 'itens'})` : 'Adicionar Produtos e Serviços'}
              </Button>
            )}

            {data.knowledge_base_enabled && !agentId && (
              <p className="text-xs text-gray-500 text-center py-2">
                Salve o agente primeiro para adicionar produtos e serviços
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card: Fluxo de Atendimento */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
        "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/15"
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                  <GitBranch className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-base font-bold text-gray-900">
                    Fluxo de Atendimento
                  </Label>
                  <p className="text-xs text-gray-600">Crie o passo a passo do atendimento do funcionário para ele seguir</p>
                </div>
              </div>

              {/* Botão */}
              <Button
                onClick={handleFlowBuilder}
                className="w-3/4 h-11 bg-white/40 backdrop-blur-sm border border-white/50 hover:bg-white/60 text-gray-900 font-medium rounded-lg transition-all"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Editar Fluxo de Atendimento
              </Button>
            </div>

            {/* Ícone ilustrativo à direita */}
            <div className="flex items-center justify-center">
              <svg width="200" height="110" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M 0 0 L 5 3 L 0 6" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </marker>
                </defs>

                {/* Linhas de conexão com setas minimalistas */}
                <path d="M 32 55 L 48 24" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                <path d="M 32 55 L 48 86" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                <path d="M 88 24 L 106 48" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                <path d="M 88 86 L 106 62" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                <path d="M 144 55 L 160 55" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrowhead)"/>

                {/* Bloco 1 */}
                <rect x="5" y="45" width="27" height="20" rx="2" fill="#4B5563" fillOpacity="0.15" stroke="#4B5563" strokeWidth="2">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
                </rect>

                {/* Bloco 2 (superior) */}
                <rect x="52" y="14" width="36" height="20" rx="2" fill="#4B5563" fillOpacity="0.15" stroke="#4B5563" strokeWidth="2">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.3s" repeatCount="indefinite"/>
                </rect>

                {/* Bloco 3 (inferior) */}
                <rect x="52" y="76" width="36" height="20" rx="2" fill="#4B5563" fillOpacity="0.15" stroke="#4B5563" strokeWidth="2">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.3s" repeatCount="indefinite"/>
                </rect>

                {/* Bloco 4 (convergência) */}
                <rect x="108" y="45" width="36" height="20" rx="2" fill="#4B5563" fillOpacity="0.15" stroke="#4B5563" strokeWidth="2">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                </rect>

                {/* Bloco 5 (final) */}
                <rect x="164" y="45" width="27" height="20" rx="2" fill="#4B5563" fillOpacity="0.15" stroke="#4B5563" strokeWidth="2">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.9s" repeatCount="indefinite"/>
                </rect>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
