import { useState } from 'react';
import { Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle } from 'lucide-react';

interface CheckIfDoneEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    decisions: Decision[];
    description?: string;
    checkField?: string;
    checkOperator?: string;
    checkValue?: string;
  };
  onSave: (data: {
    label: string;
    decisions: Decision[];
    description: string;
    checkField: string;
    checkOperator: string;
    checkValue?: string;
  }) => void;
}

export function CheckIfDoneEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: CheckIfDoneEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Verificar Se Já Fez');
  const [description, setDescription] = useState(initialData?.description || '');
  const [checkField, setCheckField] = useState(initialData?.checkField || '');
  const [checkOperator, setCheckOperator] = useState(initialData?.checkOperator || 'not_empty');
  const [checkValue, setCheckValue] = useState(initialData?.checkValue || '');

  const handleSave = () => {
    const decisions: Decision[] = [
      {
        id: `decision_${Date.now()}_0`,
        type: 'check' as const,
        condition: 'já_fez',
        targetStepId: '',
        priority: 0
      },
      {
        id: `decision_${Date.now()}_1`,
        type: 'check' as const,
        condition: 'ainda_não_fez',
        targetStepId: '',
        priority: 1
      }
    ];

    onSave({
      label,
      description,
      decisions,
      checkField,
      checkOperator,
      checkValue: checkValue || undefined
    });

    onClose();
  };

  const isValid = () => {
    return checkField.trim().length > 0;
  };

  const getOperatorLabel = (op: string) => {
    switch (op) {
      case 'not_empty': return 'existe/não está vazio';
      case 'empty': return 'não existe/está vazio';
      case 'equals': return 'é igual a';
      case 'not_equals': return 'é diferente de';
      case 'contains': return 'contém';
      case 'greater_than': return 'é maior que';
      case 'less_than': return 'é menor que';
      default: return op;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-cyan-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Verificar Se Já Fez
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Verifique se uma ação já foi realizada antes de prosseguir
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
              placeholder="Ex: Verificar se enviou RG, Checar se respondeu, Validar preenchimento..."
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Nome interno para você se organizar
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
              placeholder="Nesta etapa você irá verificar se o cliente já completou uma ação específica para evitar repetição ou pular etapas desnecessárias."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre verificação */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              O que é uma verificação?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>NÃO envia mensagens</strong> ao cliente</p>
              <p>• Verifica internamente se uma informação já existe</p>
              <p>• Evita perguntar/pedir algo que já foi feito</p>
              <p>• Redireciona automaticamente baseado no resultado</p>
            </div>
          </div>

          {/* Campo a verificar */}
          <div className="space-y-2 bg-white p-4 rounded-xl border-2 border-cyan-200 shadow-sm">
            <Label htmlFor="checkField" className="text-base font-semibold text-gray-700">
              🔍 Qual informação verificar?
            </Label>
            <Input
              id="checkField"
              value={checkField}
              onChange={(e) => setCheckField(e.target.value)}
              placeholder="Ex: tem_rg, enviou_comprovante, respondeu_nome, cpf_validado"
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Nome da variável que será verificada
            </p>
          </div>

          {/* Operador de verificação */}
          <div className="space-y-3 bg-cyan-50 p-6 rounded-xl border-2 border-cyan-200 shadow-sm">
            <Label htmlFor="checkOperator" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              Como verificar?
            </Label>
            <select
              id="checkOperator"
              value={checkOperator}
              onChange={(e) => setCheckOperator(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 text-base"
            >
              <option value="not_empty">Existe / Não está vazio</option>
              <option value="empty">Não existe / Está vazio</option>
              <option value="equals">É igual a (valor específico)</option>
              <option value="not_equals">É diferente de</option>
              <option value="contains">Contém (texto)</option>
              <option value="greater_than">É maior que (número)</option>
              <option value="less_than">É menor que (número)</option>
            </select>
            <p className="text-sm text-cyan-600">
              A condição SE <strong>{checkField || '[campo]'}</strong> {getOperatorLabel(checkOperator)}
              {['equals', 'not_equals', 'contains', 'greater_than', 'less_than'].includes(checkOperator) && ' [valor]'}
            </p>
          </div>

          {/* Valor de comparação (condicional) */}
          {['equals', 'not_equals', 'contains', 'greater_than', 'less_than'].includes(checkOperator) && (
            <div className="space-y-2 bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
              <Label htmlFor="checkValue" className="text-base font-semibold text-gray-700">
                🎯 Qual valor comparar?
              </Label>
              <Input
                id="checkValue"
                value={checkValue}
                onChange={(e) => setCheckValue(e.target.value)}
                placeholder="Ex: true, aprovado, 18, sim"
                className="text-base"
              />
              <p className="text-xs text-purple-600">
                Valor para comparar com o campo
              </p>
            </div>
          )}

          {/* Caminhos de decisão */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🔀</span>
              Caminhos possíveis
            </Label>

            <div className="space-y-3">
              {/* Já fez */}
              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-green-50 to-white border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    ✅ SE já fez (condição verdadeira)
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  A verificação passou → pode pular esta etapa ou seguir outro caminho
                </p>
              </div>

              {/* Ainda não fez */}
              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-orange-50 to-white border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                    ❌ SE ainda não fez (condição falsa)
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  A verificação falhou → precisa executar esta ação agora
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              💡 Conecte os blocos no canvas para definir para onde ir em cada situação
            </p>
          </div>

          {/* Exemplo prático */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplo prático
            </Label>
            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Cenário:</p>
                <p className="text-xs text-gray-600">
                  Antes de pedir o RG novamente, verificar se o cliente já enviou
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Verificação:</p>
                <p className="text-xs italic text-gray-600">
                  SE <strong>tem_rg</strong> não está vazio
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg space-y-1">
                <p className="text-xs">✅ <strong>Já tem:</strong> Pula para validação do RG</p>
                <p className="text-xs">❌ <strong>Não tem:</strong> Vai para solicitar RG</p>
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
                  tipo: 'check_if_done',
                  descricao: description,
                  verificacao: {
                    campo: checkField,
                    operador: checkOperator,
                    valor: checkValue || undefined
                  },
                  mensagem: [], // Sem mensagens
                  decisoes: [
                    {
                      condicao: 'já_fez',
                      proximoPasso: 'PRÓXIMO_A'
                    },
                    {
                      condicao: 'ainda_não_fez',
                      proximoPasso: 'PRÓXIMO_B'
                    }
                  ]
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
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Verificação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
