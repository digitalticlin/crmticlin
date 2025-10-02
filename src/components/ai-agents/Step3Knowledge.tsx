import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building, Lightbulb, ChevronDown, ChevronUp, Plus, X, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QAPair {
  question: string;
  answer: string;
}

interface Step3KnowledgeProps {
  data: {
    company_info: string;
    faq: QAPair[];
  };
  onChange: (field: string, value: any) => void;
}

export const Step3Knowledge = ({ data, onChange }: Step3KnowledgeProps) => {
  const navigate = useNavigate();
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
    // Navegar para o flow builder (usar 'new' como placeholder se ainda não existe agente salvo)
    const agentId = 'new'; // TODO: Passar o ID real do agente quando for implementado o salvamento
    navigate(`/ai-agents/flow-builder/${agentId}`);
  };

  const companyInfoPlaceholder = `Descreva sua empresa para o agente conhecer bem o negócio:

• Nome da empresa:
• CNPJ: (se aplicável)
• Segmento de atuação:
• Principais produtos/serviços:
• Diferenciais competitivos:
• Missão e valores:
• Localização/Área de atuação:

Exemplo:
"Somos a TicLin, uma empresa de tecnologia especializada em automação comercial para pequenas e médias empresas. Atuamos há 5 anos no mercado, oferecendo CRM, automação de WhatsApp e IA conversacional. Nosso diferencial é a simplicidade e suporte dedicado."`;

  return (
    <div className="max-w-4xl mx-auto space-y-4 relative z-20">
      {/* Informações da Empresa - Estilo KPI */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <Label className="text-lg font-bold text-gray-900">
                O que ele precisa saber sobre sua empresa?
              </Label>
              <p className="text-sm text-gray-600">Conte tudo sobre seu negócio</p>
            </div>
          </div>

          <Textarea
            value={data.company_info}
            onChange={(e) => onChange('company_info', e.target.value)}
            placeholder={companyInfoPlaceholder}
            className="min-h-[180px] text-base bg-white/60 border-2 border-white/50 focus:border-blue-500 rounded-xl transition-all"
            required
          />

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>

      {/* FAQ - Estilo KPI */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <button
            onClick={() => setFaqExpanded(!faqExpanded)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 transition-transform group-hover:scale-110">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <Label className="text-lg font-bold text-gray-900 cursor-pointer">
                  Ele já sabe responder perguntas? (Opcional)
                </Label>
                <p className="text-sm text-gray-600">
                  {data.faq.length > 0 ? `${data.faq.length} respostas prontas` : 'Adicione perguntas frequentes'}
                </p>
              </div>
            </div>
            {faqExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600 transition-transform group-hover:scale-110" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600 transition-transform group-hover:scale-110" />
            )}
          </button>

          {faqExpanded && (
            <div className="mt-4 space-y-3">
              {/* Formulário de Adição */}
              <div className="p-4 bg-white/60 border-2 border-white/50 rounded-xl space-y-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ex: Qual o horário de funcionamento?"
                  className="h-11 text-base bg-white/80 border-white/50 focus:border-orange-500 rounded-lg transition-all"
                />
                <Textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Ex: Nosso horário é de segunda a sexta, das 8h às 18h"
                  className="min-h-[70px] text-base bg-white/80 border-white/50 focus:border-orange-500 rounded-lg transition-all"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddFaq}
                    className="flex-1 h-11 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-lg transition-all"
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
                      variant="outline"
                      className="h-11 bg-white/60 border-white/50 hover:bg-white/80 rounded-lg"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de P&R */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {data.faq.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg transition-all hover:bg-orange-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                          <span className="text-orange-500">💡</span>
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
                          className="h-7 w-7 p-0 hover:bg-orange-200 rounded-lg"
                          title="Editar"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFaq(index)}
                          className="h-7 w-7 p-0 hover:bg-red-200 rounded-lg"
                          title="Remover"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {data.faq.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-3">
                    Nenhuma resposta pronta ainda. Clique em \"Adicionar\" para criar.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-400/10 rounded-full -translate-y-14 translate-x-14" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-500/10 rounded-full translate-y-10 -translate-x-10" />
        </CardContent>
      </Card>

      {/* Card 3: Fluxo de Atendimento - ATUALIZADO */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <GitBranch className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <Label className="text-xl font-bold text-gray-900">
                {data.company_info ? 'Editar fluxo de atendimento' : 'Criar fluxo de atendimento'}
              </Label>
              <p className="text-sm text-gray-600">Configure etapas personalizadas de atendimento</p>
            </div>
          </div>

          <div className="p-5 bg-cyan-50/50 border-2 border-cyan-200/50 rounded-xl">
            <p className="text-sm text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <span>Monte o fluxo de conversa para guiar o atendimento do agente de forma personalizada.</span>
            </p>

            <Button
              onClick={handleFlowBuilder}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold border-0 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <GitBranch className="h-5 w-5" />
              {data.company_info ? 'Editar Fluxo' : 'Criar Fluxo'}
              <span className="text-xs opacity-90">(Em breve)</span>
            </Button>
          </div>

          {/* Efeito visual decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600/10 rounded-full translate-y-12 -translate-x-12" />
        </CardContent>
      </Card>
    </div>
  );
};
