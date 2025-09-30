import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XCircle } from 'lucide-react';

interface EndConversationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    reason?: 'completed' | 'cancelled' | 'transferred' | 'timeout' | 'error';
    farewellMessage?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    reason: 'completed' | 'cancelled' | 'transferred' | 'timeout' | 'error';
    farewellMessage: string;
  }) => void;
}

export function EndConversationEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: EndConversationEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Finalizar Conversa');
  const [description, setDescription] = useState(initialData?.description || '');
  const [reason, setReason] = useState<'completed' | 'cancelled' | 'transferred' | 'timeout' | 'error'>(
    initialData?.reason || 'completed'
  );
  const [farewellMessage, setFarewellMessage] = useState(
    initialData?.farewellMessage || 'Foi ótimo conversar com você! Se precisar de algo, estou por aqui. Até logo! 👋'
  );

  const handleSave = () => {
    const messages: MessageText[] = [
      {
        type: 'text',
        content: farewellMessage,
        delay: 0
      }
    ];

    onSave({
      label,
      description,
      messages,
      reason,
      farewellMessage
    });

    onClose();
  };

  const isValid = () => {
    return farewellMessage.trim().length > 0;
  };

  const getReasonInfo = (r: string) => {
    switch (r) {
      case 'completed':
        return {
          icon: '✅',
          label: 'Concluído com sucesso',
          description: 'Objetivo da conversa foi alcançado',
          color: 'green'
        };
      case 'cancelled':
        return {
          icon: '❌',
          label: 'Cancelado pelo cliente',
          description: 'Cliente desistiu ou não quis continuar',
          color: 'red'
        };
      case 'transferred':
        return {
          icon: '👤',
          label: 'Transferido para humano',
          description: 'Conversa foi encaminhada para atendente',
          color: 'blue'
        };
      case 'timeout':
        return {
          icon: '⏰',
          label: 'Tempo esgotado',
          description: 'Cliente não respondeu no prazo',
          color: 'orange'
        };
      case 'error':
        return {
          icon: '⚠️',
          label: 'Erro no processamento',
          description: 'Algo deu errado durante o fluxo',
          color: 'red'
        };
      default:
        return {
          icon: '❓',
          label: r,
          description: '',
          color: 'gray'
        };
    }
  };

  const reasonInfo = getReasonInfo(reason);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Finalizar Conversa
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Encerre o fluxo de forma educada e organizada
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
              placeholder="Ex: Finalizar com sucesso, Despedida, Encerrar atendimento..."
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
              placeholder="Nesta etapa você irá finalizar a conversa de forma educada e registrar o motivo do encerramento."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre finalização */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              Como funciona a finalização?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Envia mensagem</strong> de despedida ao cliente</p>
              <p>• Registra o motivo do encerramento</p>
              <p>• Salva todas as informações coletadas</p>
              <p>• Marca a conversa como finalizada</p>
            </div>
          </div>

          {/* Motivo do encerramento */}
          <div className="space-y-3 bg-gray-50 p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <Label htmlFor="reason" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Qual o motivo do encerramento?
            </Label>
            <Select value={reason} onValueChange={(value: any) => setReason(value)}>
              <SelectTrigger className="bg-white text-base">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">✅ Concluído com sucesso</SelectItem>
                <SelectItem value="cancelled">❌ Cancelado pelo cliente</SelectItem>
                <SelectItem value="transferred">👤 Transferido para humano</SelectItem>
                <SelectItem value="timeout">⏰ Tempo esgotado (sem resposta)</SelectItem>
                <SelectItem value="error">⚠️ Erro no processamento</SelectItem>
              </SelectContent>
            </Select>

            <div className={`mt-3 p-4 rounded-lg border-2 bg-${reasonInfo.color}-50 border-${reasonInfo.color}-300`}>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">{reasonInfo.icon}</span>
                {reasonInfo.label}
              </p>
              <p className="text-xs text-gray-600 mt-1">{reasonInfo.description}</p>
            </div>
          </div>

          {/* Mensagem de despedida */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-purple-200 shadow-sm">
            <Label htmlFor="farewellMessage" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensagem de despedida
            </Label>
            <Textarea
              id="farewellMessage"
              value={farewellMessage}
              onChange={(e) => setFarewellMessage(e.target.value)}
              placeholder="Foi ótimo conversar com você! Se precisar de algo, estou por aqui. Até logo! 👋"
              rows={4}
              className="resize-none text-base"
            />
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">
                💡 Dicas para uma boa despedida
              </p>
              <ul className="text-xs text-purple-600 mt-2 space-y-1">
                <li>• Agradeça pela conversa</li>
                <li>• Seja cordial e simpático</li>
                <li>• Deixe claro que está disponível para futuras dúvidas</li>
                <li>• Use emojis para soar mais humano e amigável</li>
              </ul>
            </div>
          </div>

          {/* Sugestões de mensagens */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-xl border-2 border-cyan-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Sugestões de mensagens por motivo
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-green-700 mb-1">✅ Concluído:</p>
                <p className="text-xs italic text-gray-600">
                  "Perfeito! Finalizamos tudo com sucesso. Qualquer dúvida, é só chamar! 😊"
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-red-700 mb-1">❌ Cancelado:</p>
                <p className="text-xs italic text-gray-600">
                  "Sem problemas! Quando quiser retomar, estarei aqui. Até logo! 👋"
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-blue-700 mb-1">👤 Transferido:</p>
                <p className="text-xs italic text-gray-600">
                  "Um atendente humano vai assumir agora. Obrigado pela paciência! 😊"
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-orange-700 mb-1">⏰ Timeout:</p>
                <p className="text-xs italic text-gray-600">
                  "Parece que você está ocupado. Quando voltar, é só me chamar! Até mais! 👋"
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{farewellMessage}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
                <p className="text-xs font-semibold text-gray-700">
                  {reasonInfo.icon} Conversa finalizada: {reasonInfo.label}
                </p>
              </div>
            </div>
          </div>

          {/* O que acontece depois */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">📊</span>
              O que acontece após finalizar?
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">✓ Registros salvos</p>
                <p className="text-xs text-gray-600">
                  Todas as informações coletadas são salvas no CRM
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">✓ Status atualizado</p>
                <p className="text-xs text-gray-600">
                  Lead é marcado com o status correspondente ao motivo
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">✓ Relatórios</p>
                <p className="text-xs text-gray-600">
                  Estatísticas são atualizadas para análise posterior
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">✓ Cliente pode retornar</p>
                <p className="text-xs text-gray-600">
                  Se iniciar nova conversa, começa do zero
                </p>
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
                  tipo: 'end_conversation',
                  descricao: description,
                  motivo: reason,
                  mensagem: [farewellMessage],
                  decisoes: [] // Não há próximo passo
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
            className="flex-1 bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Finalização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
