import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Edit3, Check, CheckCircle, XCircle } from 'lucide-react';
import { Decision } from '@/types/flowBuilder';

interface SearchKnowledgeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    aiMessage?: string;
    notFoundMessage?: string;
    aiInstruction?: string;
    decisions?: Decision[];
  };
  onSave: (data: {
    label: string;
    description: string;
    aiMessage: string;
    notFoundMessage: string;
    aiInstruction: string;
    decisions: Decision[];
    block_data: any;
  }) => void;
}

export function SearchKnowledgeEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: SearchKnowledgeEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Buscar Produto/Serviço');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(
    initialData?.description || 'Cliente pergunta sobre um produto ou serviço e o agente busca na base de conhecimento'
  );
  const [aiMessage, setAiMessage] = useState(
    initialData?.aiMessage || 'Temos sim! Aqui estão as informações: [nome, descrição e preço do produto encontrado]'
  );
  const [notFoundMessage, setNotFoundMessage] = useState(
    initialData?.notFoundMessage ||
    'No momento não temos esse produto/serviço disponível. Posso te ajudar com algo mais?'
  );
  const [aiInstruction, setAiInstruction] = useState(
    initialData?.aiInstruction ||
    'Quando cliente mencionar nome de produto/serviço, buscar na base de conhecimento e responder de forma natural com as informações encontradas (nome, descrição, preço se tiver). Adaptar resposta conforme o que foi encontrado.'
  );

  const handleSave = () => {
    setIsEditingLabel(false);

    // Criar decisões fixas (2 outputs no bloco)
    const decisions: Decision[] = [
      {
        id: '1',
        condition: 'Produto/serviço encontrado',
        action: 'Seguir fluxo com produto encontrado'
      },
      {
        id: '2',
        condition: 'Produto/serviço não encontrado',
        action: 'Seguir fluxo alternativo (produto não encontrado)'
      }
    ];

    onSave({
      label,
      description,
      aiMessage,
      notFoundMessage,
      aiInstruction,
      decisions,
      block_data: {
        modo_ia: 'tool_execution_then_send',
        tool_name: 'search_product',
        instrucao_ia: aiInstruction,
        mensagem_busca: aiMessage,
        mensagem_nao_encontrado: notFoundMessage
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
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                <Package className="h-6 w-6 text-white" />
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
              O agente busca informações de produtos/serviços cadastrados
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
                placeholder="Ex: Cliente pergunta sobre um produto e o agente busca na base de dados"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiInstruction" className="text-sm font-medium text-gray-700">
                Instrução para a IA pesquisar
              </Label>
              <Textarea
                id="aiInstruction"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder='Ex: Quando cliente perguntar sobre produto, buscar e responder naturalmente com nome, descrição e preço (se houver)'
                rows={4}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Como o agente deve buscar e apresentar as informações
              </p>
            </div>

            {/* Saídas/Ramificações */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Saídas possíveis desta etapa
              </Label>

              {/* Saída 1: Produto ENCONTRADO */}
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-green-500 text-white">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-green-800 mb-1">
                      Saída 1: Produto encontrado
                    </h3>
                    <p className="text-xs text-green-700">
                      Quando a busca encontrar o produto/serviço na base
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="aiMessage" className="text-sm font-medium text-green-800">
                    Mensagem da IA
                  </Label>
                  <Textarea
                    id="aiMessage"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Ex: Temos sim! Aqui estão as informações..."
                    rows={3}
                    className="mt-1.5 bg-white/70 border-green-300 focus:border-green-500 placeholder:text-gray-500 resize-none"
                  />
                  <p className="text-xs text-green-700 mt-1">
                    O que o agente diz quando encontra o produto
                  </p>
                </div>
              </div>

              {/* Saída 2: Produto NÃO ENCONTRADO */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-500 text-white">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-red-800 mb-1">
                      Saída 2: Produto não encontrado
                    </h3>
                    <p className="text-xs text-red-700">
                      Quando a busca NÃO encontrar o produto/serviço na base
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notFoundMessage" className="text-sm font-medium text-red-800">
                    O que fazer se não encontrar?
                  </Label>
                  <Textarea
                    id="notFoundMessage"
                    value={notFoundMessage}
                    onChange={(e) => setNotFoundMessage(e.target.value)}
                    placeholder="Ex: No momento não temos esse item. Posso te ajudar com algo mais?"
                    rows={3}
                    className="mt-1.5 bg-white/70 border-red-300 focus:border-red-500 placeholder:text-gray-500 resize-none"
                  />
                  <p className="text-xs text-red-700 mt-1">
                    Mensagem quando o produto/serviço não está cadastrado
                  </p>
                </div>
              </div>
            </div>

            {/* Regras visíveis para aprovação */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-orange-800 mb-3">📋 Regras do Agente IA</h3>
              <div className="text-xs text-orange-700 space-y-3">
                <div>
                  <p className="font-semibold mb-1">⚠️ Regra Crítica:</p>
                  <p className="leading-relaxed">Buscar na base apenas quando cliente perguntar especificamente sobre um produto/serviço. Responder de forma natural e conversacional com as informações encontradas.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">💡 Importante:</p>
                  <p className="leading-relaxed">A base pode ter produtos COM preço (ex: "Notebook Dell - R$ 2.500") ou SEM preço (ex: "Consultoria personalizada - consulte valores"). Adaptar resposta conforme disponível. NUNCA inventar informações que não existem na base.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">🔀 Ramificações:</p>
                  <p className="leading-relaxed">Este bloco tem 2 SAÍDAS. Se ENCONTRAR o produto, usa Saída 1 (verde). Se NÃO ENCONTRAR, usa Saída 2 (vermelha). Conecte cada saída ao próximo passo adequado no fluxo.</p>
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
                className="px-6 py-2.5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full text-sm font-medium shadow-lg shadow-orange-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
