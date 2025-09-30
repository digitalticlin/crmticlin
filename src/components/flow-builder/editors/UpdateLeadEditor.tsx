import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCog, Plus, Trash2 } from 'lucide-react';

interface UpdateLeadEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    updates?: { field: string; value: string }[];
  };
  onSave: (data: {
    label: string;
    description: string;
    updates: { field: string; value: string }[];
  }) => void;
}

export function UpdateLeadEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: UpdateLeadEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Atualizar Dados do Lead');
  const [description, setDescription] = useState(initialData?.description || '');
  const [updates, setUpdates] = useState<{ field: string; value: string }[]>(
    initialData?.updates || [{ field: '', value: '' }]
  );

  const handleAddUpdate = () => {
    setUpdates([...updates, { field: '', value: '' }]);
  };

  const handleRemoveUpdate = (index: number) => {
    if (updates.length > 1) {
      setUpdates(updates.filter((_, i) => i !== index));
    }
  };

  const handleUpdateChange = (index: number, key: 'field' | 'value', value: string) => {
    const newUpdates = [...updates];
    newUpdates[index][key] = value;
    setUpdates(newUpdates);
  };

  const handleSave = () => {
    onSave({
      label,
      description,
      updates: updates.filter(u => u.field.trim() && u.value.trim())
    });

    onClose();
  };

  const isValid = () => {
    return updates.some(u => u.field.trim() && u.value.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-green-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 shadow-lg">
              <UserCog className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Atualizar Dados do Lead
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Atualize informações no cadastro do lead
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
              placeholder="Ex: Salvar CPF, Atualizar telefone, Marcar como interessado..."
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
              placeholder="Nesta etapa você irá atualizar informações no cadastro do lead, salvando dados coletados durante a conversa."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre atualização */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              Como funciona a atualização?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>NÃO envia mensagens</strong> ao cliente</p>
              <p>• Salva dados coletados no cadastro do lead</p>
              <p>• Útil para guardar informações importantes (CPF, email, preferências)</p>
              <p>• As informações ficam disponíveis para consulta posterior</p>
            </div>
          </div>

          {/* Campos a atualizar */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💾</span>
                  Quais dados atualizar?
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Configure quais campos do lead serão atualizados
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddUpdate}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar campo
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {updates.map((update, idx) => (
                <div key={idx} className="p-5 border-2 rounded-xl bg-gradient-to-br from-green-50 to-white space-y-4 hover:border-green-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700 bg-green-100 px-3 py-1 rounded-full">
                      Campo {idx + 1}
                    </span>
                    {updates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUpdate(idx)}
                        className="h-8 px-3 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Nome do campo:
                      </Label>
                      <Input
                        value={update.field}
                        onChange={(e) => handleUpdateChange(idx, 'field', e.target.value)}
                        placeholder="Ex: cpf, telefone, email, interesse"
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Nome do campo no banco de dados
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Valor a salvar:
                      </Label>
                      <Input
                        value={update.value}
                        onChange={(e) => handleUpdateChange(idx, 'value', e.target.value)}
                        placeholder="Ex: {cpf_cliente}, {telefone}, true"
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Use variáveis ou valores fixos
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3 bg-green-50 p-3 rounded-lg">
              💡 Use {'{nome_variavel}'} para pegar valores coletados na conversa
            </p>
          </div>

          {/* Campos comuns */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 rounded-xl border-2 border-teal-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">📋</span>
              Campos comuns do Lead
            </Label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-teal-700">Identificação</p>
                <p className="text-xs text-gray-600 mt-1">• nome • cpf • email • telefone</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-teal-700">Endereço</p>
                <p className="text-xs text-gray-600 mt-1">• cep • cidade • estado • endereco</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-teal-700">Qualificação</p>
                <p className="text-xs text-gray-600 mt-1">• interesse • renda • pontuacao</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-teal-700">Status</p>
                <p className="text-xs text-gray-600 mt-1">• status • origem • tags</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Você pode criar campos personalizados além destes
            </p>
          </div>

          {/* Exemplo prático */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplo prático
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Campo:</p>
                <p className="text-xs text-gray-600">cpf</p>
                <p className="font-semibold text-yellow-700 mb-1 mt-2">Valor:</p>
                <p className="text-xs italic text-gray-600">{'{cpf_informado}'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  → Salva o CPF que o cliente informou na conversa
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Campo:</p>
                <p className="text-xs text-gray-600">tem_interesse</p>
                <p className="font-semibold text-yellow-700 mb-1 mt-2">Valor:</p>
                <p className="text-xs italic text-gray-600">true</p>
                <p className="text-xs text-gray-500 mt-1">
                  → Marca que o lead demonstrou interesse
                </p>
              </div>
            </div>
          </div>

          {/* Resumo visual */}
          {updates.some(u => u.field.trim() || u.value.trim()) && (
            <div className="space-y-3 bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border-2 border-green-300">
              <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Resumo das atualizações
              </Label>
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                {updates.filter(u => u.field.trim() && u.value.trim()).map((update, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-sm font-semibold text-gray-700">{update.field}</span>
                    <span className="text-gray-400">←</span>
                    <span className="text-sm text-gray-600 italic">{update.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">
                Estas informações serão salvas no cadastro do lead
              </p>
            </div>
          )}

          {/* JSON Preview */}
          <details className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
              <span>🔧</span>
              <span>Ver estrutura técnica (JSON)</span>
            </summary>
            <pre className="mt-3 p-4 bg-white rounded-lg overflow-auto text-xs border border-gray-200 shadow-inner">
              {JSON.stringify(
                {
                  tipo: 'update_lead',
                  descricao: description,
                  mensagem: [], // Sem mensagens
                  atualizacoes: updates
                    .filter(u => u.field.trim() && u.value.trim())
                    .reduce((acc, u) => ({ ...acc, [u.field]: u.value }), {}),
                  decisoes: [
                    {
                      condicao: 'Sempre',
                      proximoPasso: 'PRÓXIMO'
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
            className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Atualização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
