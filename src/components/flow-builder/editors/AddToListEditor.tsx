import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Edit3, Check } from 'lucide-react';

interface AddToListEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    confirmationMessage?: string;
    aiInstruction?: string;
  };
  onSave: (data: {
    label: string;
    description: string;
    confirmationMessage: string;
    aiInstruction: string;
    block_data: any;
  }) => void;
}

export function AddToListEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: AddToListEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Adicionar Item ao Pedido');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(
    initialData?.description || 'Capturar produto, quantidade e preço para adicionar ao pedido'
  );
  const [confirmationMessage, setConfirmationMessage] = useState(
    initialData?.confirmationMessage || 'Ok! Vou adicionar ao seu pedido.'
  );
  const [aiInstruction, setAiInstruction] = useState(
    initialData?.aiInstruction ||
    'Extrair nome do produto, quantidade e preço da última mensagem do cliente e adicionar à lista de pedidos. Confirmar item adicionado com resumo: "Adicionei: [QTD]x [PRODUTO] - R$ [PREÇO]"'
  );

  const handleSave = () => {
    setIsEditingLabel(false);

    onSave({
      label,
      description,
      confirmationMessage,
      aiInstruction,
      block_data: {
        modo_ia: 'tool_execution',
        tool_name: 'add_list',
        instrucao_ia: aiInstruction,
        mensagem_confirmacao: confirmationMessage
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
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30">
                <ShoppingCart className="h-6 w-6 text-white" />
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
              Adicionar produtos à lista de pedidos do cliente
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
                placeholder="Ex: Capturar produto, quantidade e preço para adicionar ao pedido"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationMessage" className="text-sm font-medium text-gray-700">
                Mensagem de confirmação
              </Label>
              <Input
                id="confirmationMessage"
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                placeholder="Ex: Ok! Vou adicionar ao seu pedido."
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Mensagem enviada ao cliente antes de adicionar o item
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
                placeholder='Ex: Extrair nome do produto, quantidade e preço da última mensagem do cliente...'
                rows={4}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Como o agente deve extrair e adicionar os dados do produto
              </p>
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
                className="px-6 py-2.5 bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-full text-sm font-medium shadow-lg shadow-rose-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
