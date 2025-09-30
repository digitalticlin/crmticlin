import { useState } from 'react';
import { MessageText, Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AskQuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description: string;
  }) => void;
}

interface ResponseOption {
  id: string;
  condition: string;
  targetStepId: string;
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
  const [question, setQuestion] = useState('');
  const [checkIfAlreadyAsked, setCheckIfAlreadyAsked] = useState(false);
  const [checkField, setCheckField] = useState('');
  const [responseOptions, setResponseOptions] = useState<ResponseOption[]>([
    {
      id: '1',
      condition: '',
      targetStepId: '',
      action: ''
    }
  ]);

  const handleAddOption = () => {
    setResponseOptions([
      ...responseOptions,
      {
        id: Date.now().toString(),
        condition: '',
        targetStepId: '',
        action: ''
      }
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (responseOptions.length > 1) {
      setResponseOptions(responseOptions.filter(opt => opt.id !== id));
    }
  };

  const handleOptionChange = (id: string, field: keyof ResponseOption, value: string) => {
    setResponseOptions(
      responseOptions.map(opt =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
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

    const decisions: Decision[] = responseOptions
      .filter(opt => opt.condition && opt.targetStepId)
      .map((opt, idx) => ({
        id: `decision_${Date.now()}_${idx}`,
        type: 'if_user_says' as const,
        condition: opt.condition,
        targetStepId: opt.targetStepId,
        priority: idx,
        action: opt.action || undefined
      }));

    onSave({
      label,
      description,
      messages,
      decisions
    });

    onClose();
  };

  const getPreview = () => {
    if (!question.trim()) return 'Digite uma pergunta...';
    return question;
  };

  const isValid = () => {
    if (!question.trim()) return false;
    if (responseOptions.every(opt => !opt.condition && !opt.targetStepId)) return false;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Fazer Pergunta
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure uma pergunta e como processar as respostas
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Nome do passo */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="label" className="text-base font-semibold text-gray-700">
              📝 Como você quer chamar este passo?
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Perguntar se tem documento, Confirmar interesse..."
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Dê um nome que facilite identificar no fluxo
            </p>
          </div>

          {/* Descrição da etapa */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="description" className="text-base font-semibold text-gray-700">
              📋 O que deve acontecer nesta etapa?
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nesta etapa você irá perguntar se o cliente já possui o extrato bancário para decidir o próximo passo."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Pergunta */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
            <Label htmlFor="question" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">❓</span>
              O que você quer perguntar ao cliente?
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Você já tem o extrato bancário dos últimos 3 meses?"
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-sm text-gray-600">
              💡 Seja claro e objetivo. O cliente vai receber exatamente essa mensagem.
            </p>
          </div>

          {/* Validação prévia */}
          <div className="bg-amber-50 p-5 rounded-xl border-2 border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <Label className="text-base font-semibold text-gray-800">
                  🔍 Verificar se já perguntou antes?
                </Label>
                <p className="text-sm text-gray-600">
                  Evita fazer a mesma pergunta duas vezes
                </p>
              </div>
              <Switch
                checked={checkIfAlreadyAsked}
                onCheckedChange={setCheckIfAlreadyAsked}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>

            {checkIfAlreadyAsked && (
              <div className="space-y-2 mt-4 p-4 bg-white rounded-lg">
                <Label htmlFor="checkField" className="text-sm font-medium text-gray-700">
                  Qual informação verificar?
                </Label>
                <Input
                  id="checkField"
                  value={checkField}
                  onChange={(e) => setCheckField(e.target.value)}
                  placeholder="Ex: tem_extrato, forneceu_cpf, respondeu_interesse"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Se esta informação já existir, a IA pula esta pergunta automaticamente
                </p>
              </div>
            )}
          </div>

          {/* O que fazer com as respostas */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🔀</span>
                  O que fazer com as respostas?
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Configure o caminho que a conversa deve seguir baseado na resposta
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar opção
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {responseOptions.map((option, idx) => (
                <div key={option.id} className="p-5 border-2 rounded-xl bg-gradient-to-br from-gray-50 to-white space-y-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700 bg-blue-100 px-3 py-1 rounded-full">
                      Opção {idx + 1}
                    </span>
                    {responseOptions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(option.id)}
                        className="h-8 px-3 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      SE o cliente responder:
                    </Label>
                    <Input
                      value={option.condition}
                      onChange={(e) => handleOptionChange(option.id, 'condition', e.target.value)}
                      placeholder='Ex: "sim", "já tenho", "tenho sim"'
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      💡 Palavras-chave que indicam esta resposta (separe com vírgulas)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      ENTÃO ir para qual passo?
                    </Label>
                    <Input
                      value={option.targetStepId}
                      onChange={(e) => handleOptionChange(option.id, 'targetStepId', e.target.value)}
                      placeholder="Conecte os blocos no canvas e isso será preenchido automaticamente"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      📌 Você pode conectar manualmente no canvas depois
                    </p>
                  </div>

                  <div className="space-y-2 bg-purple-50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700">
                      💾 Guardar resposta em: (opcional)
                    </Label>
                    <Input
                      value={option.action || ''}
                      onChange={(e) => handleOptionChange(option.id, 'action', e.target.value)}
                      placeholder="Ex: tem_extrato, cpf_cliente, nome_produto"
                      className="text-sm"
                    />
                    <p className="text-xs text-purple-600">
                      Use isso para salvar a resposta e reutilizar depois
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerta de validação */}
          {!isValid() && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ⚠️ Preencha a pergunta e pelo menos uma opção de resposta para continuar
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 bg-blue-50 p-3 rounded-2xl rounded-tl-none">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{getPreview()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          <details className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
              <span>🔧</span>
              <span>Ver estrutura técnica (JSON)</span>
            </summary>
            <pre className="mt-3 p-4 bg-white rounded-lg overflow-auto text-xs border border-gray-200 shadow-inner">
              {JSON.stringify(
                {
                  tipo: 'ask_question',
                  descricao: description,
                  validacao_previa: checkIfAlreadyAsked
                    ? {
                        campo: checkField,
                        operador: 'not_empty'
                      }
                    : undefined,
                  mensagem: [question],
                  decisoes: responseOptions
                    .filter(opt => opt.condition)
                    .map(opt => ({
                      condicao: opt.condition,
                      proximoPasso: opt.targetStepId || 'PRÓXIMO',
                      acao: opt.action || undefined
                    }))
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>

        <DialogFooter className="border-t pt-4 gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ❌ Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Pergunta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
