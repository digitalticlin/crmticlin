import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit3, Check } from 'lucide-react';

interface RemoveFromListEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    mainMessage?: string;
    aiInstruction?: string;
    identifyBy?: 'nome' | 'numero' | 'nome_ou_numero';
    confirmationMessage?: string;
    clearMode?: 'individual' | 'delete_all' | 'clear_all';
  };
  onSave: (data: {
    label: string;
    description: string;
    mainMessage: string;
    aiInstruction: string;
    identifyBy: string;
    confirmationMessage: string;
    clearMode: string;
    block_data: any;
  }) => void;
}

export function RemoveFromListEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: RemoveFromListEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Remover Item do Pedido');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(
    initialData?.description || 'Identificar e remover item específico do pedido'
  );
  const [mainMessage, setMainMessage] = useState(
    initialData?.mainMessage || 'Qual item você quer remover do pedido?'
  );
  const [aiInstruction, setAiInstruction] = useState(
    initialData?.aiInstruction ||
    'Identificar o item que o cliente quer remover (por nome ou número da lista) e executar remove_from_list. Confirmar remoção: "Removi [ITEM] do pedido"'
  );
  const [identifyBy, setIdentifyBy] = useState<'nome' | 'numero' | 'nome_ou_numero'>(
    initialData?.identifyBy || 'nome_ou_numero'
  );
  const [confirmationMessage, setConfirmationMessage] = useState(
    initialData?.confirmationMessage || 'Removi [ITEM] do pedido'
  );
  const [clearMode, setClearMode] = useState<'individual' | 'delete_all' | 'clear_all'>(
    initialData?.clearMode || 'individual'
  );

  const handleSave = () => {
    setIsEditingLabel(false);

    onSave({
      label,
      description,
      mainMessage,
      aiInstruction,
      identifyBy,
      confirmationMessage,
      clearMode,
      block_data: {
        modo_ia: 'tool_execution',
        tool_name: 'remove_from_list',
        instrucao_ia: aiInstruction,
        identificar_por: identifyBy,
        mensagem_principal: mainMessage,
        mensagem_confirmacao: confirmationMessage,
        modo_limpeza: clearMode
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
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-500/30">
                <Trash2 className="h-6 w-6 text-white" />
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
              Remover produtos da lista de pedidos do cliente
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
                placeholder="Ex: Identificar e remover item específico do pedido"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainMessage" className="text-sm font-medium text-gray-700">
                Pergunta ao cliente
              </Label>
              <Input
                id="mainMessage"
                value={mainMessage}
                onChange={(e) => setMainMessage(e.target.value)}
                placeholder="Ex: Qual item você quer remover do pedido?"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Pergunta para identificar qual item remover
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clearMode" className="text-sm font-medium text-gray-700">
                Modo de remoção
              </Label>
              <Select value={clearMode} onValueChange={(value: any) => setClearMode(value)}>
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">🎯 Remover item individual (padrão)</SelectItem>
                  <SelectItem value="clear_all">🗑️ Limpar toda lista (manter histórico)</SelectItem>
                  <SelectItem value="delete_all">❌ Deletar toda lista (apagar registros)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {clearMode === 'individual' && 'Remove apenas 1 item por vez durante a conversa'}
                {clearMode === 'clear_all' && 'Limpa toda lista ao final do fluxo (mantém registros marcados como limpos)'}
                {clearMode === 'delete_all' && 'Apaga TODOS os registros da lista ao final do fluxo'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifyBy" className="text-sm font-medium text-gray-700">
                Como identificar o item?
              </Label>
              <Select value={identifyBy} onValueChange={(value: any) => setIdentifyBy(value)}>
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome_ou_numero">🔢 Por Nome ou Número (flexível)</SelectItem>
                  <SelectItem value="nome">📝 Apenas por Nome do Produto</SelectItem>
                  <SelectItem value="numero">🔢 Apenas por Número da Lista</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Como o cliente vai indicar qual item remover (válido apenas para modo individual)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationMessage" className="text-sm font-medium text-gray-700">
                Mensagem de confirmação
              </Label>
              <Input
                id="confirmationMessage"
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                placeholder="Ex: Removi [ITEM] do pedido"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Use [ITEM] como placeholder para o nome do produto removido
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiInstruction" className="text-sm font-medium text-gray-700">
                Instruções para o agente IA
              </Label>
              <Textarea
                id="aiInstruction"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder='Ex: Identificar o item que o cliente quer remover...'
                rows={4}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Como o agente deve identificar e remover o item
              </p>
            </div>

            {/* Regras visíveis para aprovação */}
            <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">📋 Regras do Agente IA</h3>
              <div className="text-xs text-slate-700 space-y-3">
                <div>
                  <p className="font-semibold mb-1">⚠️ Regra Crítica:</p>
                  <p className="leading-relaxed">Tool usada em 2 cenários: (1) Cliente pede remover item específico durante GET_LIST - remover e voltar para confirmar. (2) FINAL do fluxo - limpar ou deletar TODA a lista conforme configurado</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">💡 Importante:</p>
                  <p className="leading-relaxed">Modo individual: remover 1 item e voltar para get_list. Modo total: limpar ou deletar toda lista (final do fluxo). Confirmar qual modo usar conforme configuração do bloco</p>
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
                className="px-6 py-2.5 bg-gradient-to-br from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-full text-sm font-medium shadow-lg shadow-slate-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
