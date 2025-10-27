import { useState } from 'react';
import { MessageText, Decision } from '@/types/flowBuilder';
import { FallbackConfig } from '@/types/flowStructure';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircleQuestion, Check, Lightbulb, Plus, Trash2, ArrowRight, Edit3, AlertCircle, ChevronDown } from 'lucide-react';

interface AskQuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    decisions?: Decision[];
    description?: string;
    fallback?: FallbackConfig;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description: string;
    fallback?: FallbackConfig;
  }) => void;
}

interface DecisionOption {
  id: string;
  condition: string;
  action?: string;
}

export function AskQuestionEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: AskQuestionEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Fazer Pergunta');
  const [description, setDescription] = useState(initialData?.description || '');
  const [question, setQuestion] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState<DecisionOption[]>(
    initialData?.decisions?.map(d => ({
      id: d.id || Date.now().toString(),
      condition: d.condition,
      action: d.action
    })) || [{ id: '1', condition: '', action: '' }]
  );

  // 🆕 Estados para Fallback
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackAction, setFallbackAction] = useState<'reformular' | 'transferir_humano' | 'pular_para' | 'nao_fazer_nada'>(
    initialData?.fallback?.se_nao_entender?.acao || 'nao_fazer_nada'
  );
  const [fallbackAttempts, setFallbackAttempts] = useState(
    initialData?.fallback?.se_nao_entender?.tentativas_maximas || 2
  );
  const [fallbackMessage, setFallbackMessage] = useState(
    initialData?.fallback?.se_nao_entender?.mensagem_alternativa || ''
  );
  const [fallbackFailAction, setFallbackFailAction] = useState<'transferir_humano' | 'seguir_fluxo'>(
    initialData?.fallback?.se_nao_entender?.se_falhar?.acao || 'transferir_humano'
  );
  const [fallbackFailMessage, setFallbackFailMessage] = useState(
    initialData?.fallback?.se_nao_entender?.se_falhar?.mensagem || ''
  );

  const addDecisionOption = () => {
    setDecisionOptions([
      ...decisionOptions,
      { id: Date.now().toString(), condition: '', action: '' }
    ]);
  };

  const removeDecisionOption = (id: string) => {
    if (decisionOptions.length > 1) {
      setDecisionOptions(decisionOptions.filter(opt => opt.id !== id));
    }
  };

  const updateDecisionOption = (id: string, field: keyof DecisionOption, value: string) => {
    setDecisionOptions(
      decisionOptions.map(opt => opt.id === id ? { ...opt, [field]: value } : opt)
    );
  };

  const handleSave = () => {
    const messages: MessageText[] = [
      {
        type: 'text',
        content: question,
        delay: 0
      }
    ];

    const decisions: Decision[] = decisionOptions
      .filter(opt => opt.condition.trim())
      .map((opt, idx) => ({
        id: opt.id,
        type: 'if_user_says' as const,
        condition: opt.condition,
        targetStepId: '', // Será preenchido quando conectar no canvas
        outputHandle: `output-${idx}`, // ID do handle correspondente
        priority: idx,
        action: opt.action || undefined
      }));

    // 🆕 Construir fallback config
    const fallback: FallbackConfig | undefined = fallbackAction !== 'nao_fazer_nada' ? {
      se_nao_entender: {
        acao: fallbackAction,
        tentativas_maximas: fallbackAttempts,
        mensagem_alternativa: fallbackAction === 'reformular' ? fallbackMessage : undefined,
        se_falhar: fallbackAction === 'reformular' ? {
          acao: fallbackFailAction,
          mensagem: fallbackFailMessage
        } : undefined
      }
    } : undefined;

    onSave({
      label,
      description,
      messages,
      decisions,
      fallback
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        {/* Todo o conteúdo em scroll único */}
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          {/* Header integrado no conteúdo */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <MessageCircleQuestion className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                {isEditingLabel ? (
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
                    autoFocus
                    className="h-10 text-xl font-bold bg-white/30 border-white/40 focus:border-blue-500 rounded-xl"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingLabel(true)}
                      className="h-8 w-8 rounded-lg hover:bg-white/40"
                    >
                      <Edit3 className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo do formulário */}
          <div className="px-8 pb-8 space-y-6">
            {/* Descrição */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
                </div>
                O que acontece nesta etapa?
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A IA pergunta ao cliente se ele possui o documento necessário..."
                rows={3}
                className="resize-none bg-white/30 border-white/40 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                <Lightbulb className="h-3 w-3 text-gray-400" />
                A IA usa isso como contexto para executar a etapa
              </p>
            </div>

            {/* Pergunta */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <MessageCircleQuestion className="h-3.5 w-3.5 text-blue-600" />
                </div>
                Qual a pergunta?
              </Label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Você já tem o documento em mãos?"
                rows={3}
                className="resize-none bg-white/30 border-white/40 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl placeholder:text-gray-500"
              />
            </div>

            {/* Opções de Resposta (Decisões) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  O que fazer com as respostas?
                </Label>
                <button
                  onClick={addDecisionOption}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white/30 hover:bg-white/50 border border-white/40 rounded-full transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar opção
                </button>
              </div>

              <p className="text-xs text-gray-600">
                Configure as possíveis respostas e o próximo passo para cada uma
              </p>

              <div className="space-y-3">
                {decisionOptions.map((option, index) => (
                  <div key={option.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-3 p-4 bg-white/30 border border-white/40 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-600">Opção {index + 1}</span>
                        {decisionOptions.length > 1 && (
                          <button
                            onClick={() => removeDecisionOption(option.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-700">SE o cliente responder:</Label>
                        <Input
                          value={option.condition}
                          onChange={(e) => updateDecisionOption(option.id, 'condition', e.target.value)}
                          placeholder='Ex: "sim", "já tenho", "tenho"'
                          className="h-9 text-sm bg-white/50 border-white/40 focus:border-blue-500 rounded-lg placeholder:text-gray-500"
                        />
                      </div>

                      {/* Badge de Saída Modernizado */}
                      <div className="relative overflow-hidden p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-md opacity-50"></div>
                            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-lg">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-blue-700">SAÍDA {index + 1}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                            <p className="text-xs text-blue-600/80 mt-0.5">Conecte no canvas ao próximo bloco</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🆕 Seção de Fallback */}
            <div className="border-t pt-6 mt-6 border-white/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowFallback(!showFallback)}
                className="w-full flex items-center justify-between h-12 px-4 bg-orange-50/50 hover:bg-orange-100/50 border border-orange-200/50 rounded-xl transition-all"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  E se o cliente não entender ou responder outra coisa?
                </span>
                <ChevronDown className={`h-4 w-4 text-orange-600 transition-transform ${showFallback ? 'rotate-180' : ''}`} />
              </Button>

              {showFallback && (
                <div className="mt-4 space-y-4 bg-orange-50/30 p-5 rounded-xl border border-orange-200/50">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-900">O que fazer?</Label>

                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 bg-white/50 border border-white/60 rounded-lg cursor-pointer hover:bg-white/70 transition-all">
                        <input
                          type="radio"
                          name="fallbackAction"
                          value="nao_fazer_nada"
                          checked={fallbackAction === 'nao_fazer_nada'}
                          onChange={(e) => setFallbackAction(e.target.value as any)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Não fazer nada</div>
                          <div className="text-xs text-gray-600">Seguir normalmente mesmo sem entender</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-white/50 border border-white/60 rounded-lg cursor-pointer hover:bg-white/70 transition-all">
                        <input
                          type="radio"
                          name="fallbackAction"
                          value="reformular"
                          checked={fallbackAction === 'reformular'}
                          onChange={(e) => setFallbackAction(e.target.value as any)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">✅ Tentar perguntar de outro jeito (Recomendado)</div>
                          <div className="text-xs text-gray-600">Reformular a pergunta se o cliente não entender</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-white/50 border border-white/60 rounded-lg cursor-pointer hover:bg-white/70 transition-all">
                        <input
                          type="radio"
                          name="fallbackAction"
                          value="transferir_humano"
                          checked={fallbackAction === 'transferir_humano'}
                          onChange={(e) => setFallbackAction(e.target.value as any)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Transferir para atendente humano</div>
                          <div className="text-xs text-gray-600">Conectar imediatamente com um atendente</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Configurações para "reformular" */}
                  {fallbackAction === 'reformular' && (
                    <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-900">Como perguntar de forma diferente?</Label>
                        <Textarea
                          value={fallbackMessage}
                          onChange={(e) => setFallbackMessage(e.target.value)}
                          placeholder="Deixa eu explicar melhor: você tem um consórcio ativo agora ou já cancelou?"
                          rows={3}
                          className="resize-none text-sm bg-white/70 border-white/60 focus:border-blue-500 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-900">Quantas vezes tentar?</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={fallbackAttempts}
                          onChange={(e) => setFallbackAttempts(parseInt(e.target.value) || 2)}
                          className="w-24 h-9 text-sm bg-white/70 border-white/60 focus:border-blue-500 rounded-lg"
                        />
                        <p className="text-xs text-gray-600">Recomendado: 2 vezes</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-900">Se mesmo assim não funcionar, o que fazer?</Label>
                        <div className="space-y-2">
                          <label className="flex items-start gap-3 p-3 bg-white/70 border border-white/60 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                            <input
                              type="radio"
                              name="fallbackFailAction"
                              value="transferir_humano"
                              checked={fallbackFailAction === 'transferir_humano'}
                              onChange={(e) => setFallbackFailAction(e.target.value as any)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">Transferir para atendente humano</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 bg-white/70 border border-white/60 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                            <input
                              type="radio"
                              name="fallbackFailAction"
                              value="seguir_fluxo"
                              checked={fallbackFailAction === 'seguir_fluxo'}
                              onChange={(e) => setFallbackFailAction(e.target.value as any)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">Seguir para próximo passo mesmo assim</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {fallbackFailAction === 'transferir_humano' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-900">Mensagem ao transferir</Label>
                          <Textarea
                            value={fallbackFailMessage}
                            onChange={(e) => setFallbackFailMessage(e.target.value)}
                            placeholder="Vou te conectar com um especialista que vai te ajudar melhor 😊"
                            rows={2}
                            className="resize-none text-sm bg-white/70 border-white/60 focus:border-blue-500 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ações - Ultra Minimalistas */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/40 mt-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white/30 hover:bg-white/50 border border-white/40 rounded-full transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 border border-blue-600 rounded-full transition-all shadow-sm"
              >
                <Check className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
