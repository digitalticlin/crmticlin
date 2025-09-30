import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';

interface SendMessageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    delay?: number;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    delay: number;
  }) => void;
}

export function SendMessageEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: SendMessageEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Enviar Mensagem');
  const [description, setDescription] = useState(initialData?.description || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [delay, setDelay] = useState<number>(initialData?.delay || 0);

  const handleSave = () => {
    const messages: MessageText[] = [
      {
        type: 'text',
        content: message,
        delay: delay
      }
    ];

    onSave({
      label,
      description,
      messages,
      delay
    });

    onClose();
  };

  const getPreview = () => {
    if (!message.trim()) return 'Digite uma mensagem...';
    return message;
  };

  const isValid = () => {
    return message.trim().length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Send className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Enviar Mensagem
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Envie uma mensagem informativa sem aguardar resposta específica
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
              placeholder="Ex: Confirmar recebimento, Avisar processamento..."
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
              placeholder="Nesta etapa você irá confirmar o recebimento do documento e avisar que está processando."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Mensagem */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-purple-200 shadow-sm">
            <Label htmlFor="message" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Qual mensagem enviar?
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Ótimo! Recebi seu documento. Vou analisar e já te retorno."
              rows={4}
              className="resize-none text-base"
            />
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">
                💡 Esta é uma mensagem informativa
              </p>
              <p className="text-xs text-purple-600 mt-1">
                A conversa continuará automaticamente após enviar
              </p>
            </div>
          </div>

          {/* Delay */}
          <div className="space-y-3 bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200">
            <Label htmlFor="delay" className="text-base font-semibold text-gray-800">
              ⏱️ Delay antes de enviar
            </Label>
            <Select value={delay.toString()} onValueChange={(value) => setDelay(Number(value))}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o delay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Imediato</SelectItem>
                <SelectItem value="2000">2 segundos</SelectItem>
                <SelectItem value="5000">5 segundos</SelectItem>
                <SelectItem value="10000">10 segundos</SelectItem>
                <SelectItem value="30000">30 segundos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-indigo-600">
              Simula 'digitando...' para parecer mais natural
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 bg-purple-50 p-3 rounded-2xl rounded-tl-none">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{getPreview()}</p>
                </div>
              </div>
              {delay > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ⏱️ Aguarda {delay / 1000}s antes de enviar
                </p>
              )}
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
                  tipo: 'send_message',
                  descricao: description,
                  mensagem: [message],
                  delay: delay,
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
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            ✅ Salvar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
