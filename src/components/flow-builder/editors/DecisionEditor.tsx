import { useState } from 'react';
import { Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, Plus, Trash2 } from 'lucide-react';

interface DecisionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    decisions: Decision[];
    description?: string;
  };
  onSave: (data: {
    label: string;
    decisions: Decision[];
    description: string;
  }) => void;
}

interface ConditionOption {
  id: string;
  condition: string;
  targetStepId: string;
}

export function DecisionEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: DecisionEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Decisão (SE/ENTÃO)');
  const [description, setDescription] = useState(initialData?.description || '');
  const [conditions, setConditions] = useState<ConditionOption[]>(
    initialData?.decisions.map(d => ({
      id: d.id || Date.now().toString(),
      condition: d.condition,
      targetStepId: d.targetStepId
    })) || [
      { id: '1', condition: '', targetStepId: '' },
      { id: '2', condition: '', targetStepId: '' }
    ]
  );

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Date.now().toString(),
        condition: '',
        targetStepId: ''
      }
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    if (conditions.length > 2) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const handleConditionChange = (id: string, field: keyof ConditionOption, value: string) => {
    setConditions(
      conditions.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSave = () => {
    const decisions: Decision[] = conditions
      .filter(c => c.condition.trim())
      .map((c, idx) => ({
        id: `decision_${Date.now()}_${idx}`,
        type: 'condition' as const,
        condition: c.condition,
        targetStepId: c.targetStepId,
        priority: idx
      }));

    onSave({
      label,
      description,
      decisions
    });

    onClose();
  };

  const isValid = () => {
    return conditions.filter(c => c.condition.trim()).length >= 2;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-yellow-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
              <GitBranch className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Decisão (SE/ENTÃO)
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure múltiplas condições e caminhos sem mensagens
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
              placeholder="Ex: Verificar renda, Decidir próximo passo, Checar elegibilidade..."
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
              placeholder="Nesta etapa você irá avaliar múltiplas condições e decidir qual caminho seguir sem enviar mensagens ao cliente."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre bloco de decisão */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              O que é um bloco de Decisão?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>NÃO envia mensagens</strong> ao cliente</p>
              <p>• Avalia condições e <strong>redireciona automaticamente</strong></p>
              <p>• Útil para lógica interna (SE renda {'>'} 5000 ENTÃO passo A, SENÃO passo B)</p>
              <p>• Pode ter 2 ou mais caminhos de saída</p>
            </div>
          </div>

          {/* Condições */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🔀</span>
                  Configure as condições (SE/ENTÃO)
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  A IA avaliará na ordem e seguirá o primeiro caminho que corresponder
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar caminho
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {conditions.map((condition, idx) => (
                <div key={condition.id} className="p-5 border-2 rounded-xl bg-gradient-to-br from-yellow-50 to-white space-y-4 hover:border-yellow-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700 bg-yellow-100 px-3 py-1 rounded-full">
                      Caminho {idx + 1}
                    </span>
                    {conditions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCondition(condition.id)}
                        className="h-8 px-3 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      SE (condição):
                    </Label>
                    <Textarea
                      value={condition.condition}
                      onChange={(e) => handleConditionChange(condition.id, 'condition', e.target.value)}
                      placeholder='Ex: "renda_mensal > 5000", "tem_restricao_cpf == false", "idade >= 18"'
                      className="text-sm"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500">
                      💡 Descreva a condição em linguagem natural ou lógica
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      ENTÃO ir para qual passo?
                    </Label>
                    <Input
                      value={condition.targetStepId}
                      onChange={(e) => handleConditionChange(condition.id, 'targetStepId', e.target.value)}
                      placeholder="Conecte os blocos no canvas e isso será preenchido automaticamente"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      📌 Você pode conectar manualmente no canvas depois
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Caminho padrão (else) */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span>⚠️</span>
                Importante: Sempre adicione um caminho SENÃO (else)
              </Label>
              <p className="text-xs text-gray-600">
                O último caminho deve ser uma condição genérica como "caso contrário" ou "se nenhuma condição anterior" para garantir que sempre haja uma saída.
              </p>
            </div>
          </div>

          {/* Exemplo prático */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplo prático
            </Label>
            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">Caminho 1 - SE:</p>
                <p className="text-xs italic text-gray-600">renda_mensal {'>'} 5000 E sem_restricao_cpf</p>
                <p className="text-xs text-gray-500 mt-1">→ Vai para "Aprovação Automática"</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">Caminho 2 - SE:</p>
                <p className="text-xs italic text-gray-600">renda_mensal entre 2000 e 5000</p>
                <p className="text-xs text-gray-500 mt-1">→ Vai para "Análise Manual"</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">Caminho 3 - SENÃO:</p>
                <p className="text-xs italic text-gray-600">qualquer outra situação</p>
                <p className="text-xs text-gray-500 mt-1">→ Vai para "Negado"</p>
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
                  tipo: 'decision',
                  descricao: description,
                  mensagem: [], // Sem mensagens
                  decisoes: conditions
                    .filter(c => c.condition.trim())
                    .map((c, idx) => ({
                      condicao: c.condition,
                      proximoPasso: c.targetStepId || `PRÓXIMO_${String.fromCharCode(65 + idx)}`,
                      prioridade: idx
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
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Decisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
