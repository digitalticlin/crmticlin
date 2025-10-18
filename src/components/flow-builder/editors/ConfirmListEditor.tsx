import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ListChecks, Edit3, Check } from 'lucide-react';

interface ConfirmListEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    mainMessage?: string;
    aiInstruction?: string;
    displayFormat?: 'lista_numerada' | 'resumo' | 'detalhado';
    showTotal?: boolean;
    allowEdit?: boolean;
  };
  onSave: (data: {
    label: string;
    description: string;
    mainMessage: string;
    aiInstruction: string;
    displayFormat: string;
    showTotal: boolean;
    allowEdit: boolean;
    block_data: any;
  }) => void;
}

export function ConfirmListEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: ConfirmListEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Confirmar Pedido Completo');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(
    initialData?.description || 'Exibir todos os itens do pedido e solicitar confirmação final'
  );
  const [mainMessage, setMainMessage] = useState(
    initialData?.mainMessage || 'Aqui está seu pedido completo:'
  );
  const [aiInstruction, setAiInstruction] = useState(
    initialData?.aiInstruction ||
    'Buscar todos os itens do pedido usando get_list, formatar em lista numerada com total, enviar para o cliente e perguntar: "Está tudo correto? Posso confirmar o pedido?"'
  );
  const [displayFormat, setDisplayFormat] = useState<'lista_numerada' | 'resumo' | 'detalhado'>(
    initialData?.displayFormat || 'lista_numerada'
  );
  const [showTotal, setShowTotal] = useState(initialData?.showTotal ?? true);
  const [allowEdit, setAllowEdit] = useState(initialData?.allowEdit ?? true);

  const handleSave = () => {
    setIsEditingLabel(false);

    onSave({
      label,
      description,
      mainMessage,
      aiInstruction,
      displayFormat,
      showTotal,
      allowEdit,
      block_data: {
        modo_ia: 'tool_execution_then_send',
        tool_name: 'get_list',
        instrucao_ia: aiInstruction,
        formato_exibicao: displayFormat,
        exibir_total: showTotal,
        permitir_edicao: allowEdit,
        mensagem_principal: mainMessage
      }
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30">
                <ListChecks className="h-6 w-6 text-white" />
              </div>

              {isEditingLabel ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="text-xl font-bold bg-white/30 border-white/40"
                    autoFocus
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingLabel(false);
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{label}</h2>
                  <button
                    onClick={() => setIsEditingLabel(true)}
                    className="p-1.5 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2 ml-[60px]">
              Mostrar resumo completo do pedido e confirmar com cliente
            </p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                O que deve acontecer nesta etapa?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Exibir todos os itens do pedido e solicitar confirmação final"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainMessage" className="text-sm font-medium text-gray-700">
                Mensagem inicial
              </Label>
              <Input
                id="mainMessage"
                value={mainMessage}
                onChange={(e) => setMainMessage(e.target.value)}
                placeholder="Ex: Aqui está seu pedido completo:"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Mensagem enviada antes de mostrar a lista de itens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayFormat" className="text-sm font-medium text-gray-700">
                Formato de exibição
              </Label>
              <Select value={displayFormat} onValueChange={(value: any) => setDisplayFormat(value)}>
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lista_numerada">📋 Lista Numerada</SelectItem>
                  <SelectItem value="resumo">📝 Resumo Simples</SelectItem>
                  <SelectItem value="detalhado">📊 Detalhado (com preços unitários)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Como os itens do pedido serão apresentados ao cliente
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/20 border border-white/30 rounded-xl p-4">
                <div className="flex-1">
                  <Label htmlFor="showTotal" className="text-sm font-medium text-gray-700">
                    Exibir total do pedido
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Mostrar valor total ao final da lista
                  </p>
                </div>
                <Switch
                  id="showTotal"
                  checked={showTotal}
                  onCheckedChange={setShowTotal}
                />
              </div>

              <div className="flex items-center justify-between bg-white/20 border border-white/30 rounded-xl p-4">
                <div className="flex-1">
                  <Label htmlFor="allowEdit" className="text-sm font-medium text-gray-700">
                    Permitir edição
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Cliente pode adicionar/remover itens antes de confirmar
                  </p>
                </div>
                <Switch
                  id="allowEdit"
                  checked={allowEdit}
                  onCheckedChange={setAllowEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiInstruction" className="text-sm font-medium text-gray-700">
                Instruções para o agente IA
              </Label>
              <Textarea
                id="aiInstruction"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder='Ex: Buscar todos os itens do pedido usando get_list...'
                rows={4}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Como o agente deve buscar, formatar e apresentar o pedido
              </p>
            </div>

            {/* Regras visíveis para aprovação */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-3">📋 Regras do Agente IA</h3>
              <div className="text-xs text-amber-700 space-y-3">
                <div>
                  <p className="font-semibold mb-1">⚠️ Regra Crítica:</p>
                  <p className="leading-relaxed">USAR tool get_list para mostrar lista. Se cliente pedir REMOVER item, usar tool remove_from_list e EXECUTAR get_list NOVAMENTE. Se cliente pedir ALTERAR item, usar remove_from_list (item antigo) + add_to_list (item novo) + get_list. NUNCA confirmar sem autorização explícita</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">💡 Importante:</p>
                  <p className="leading-relaxed">Sempre reexecutar get_list após qualquer edição (remoção ou alteração) para cliente confirmar mudanças. Perguntar "Agora está correto?" após cada alteração</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!label.trim() || !description.trim()}
                className="px-6 py-2.5 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full text-sm font-medium shadow-lg shadow-amber-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
