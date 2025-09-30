import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';

interface PresentationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
  }) => void;
}

export function PresentationEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: PresentationEditorProps) {
  const [label, setLabel] = useState(initialData?.label || '👋 Apresentação Inicial');
  const [description, setDescription] = useState(initialData?.description || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [askName, setAskName] = useState(true);

  const handleSave = () => {
    let messageContent = message;

    if (askName && !message.includes('nome')) {
      messageContent = message + '\n\nQual o seu nome?';
    }

    const messages: MessageText[] = [
      {
        type: 'text',
        content: messageContent,
        delay: 0
      }
    ];

    onSave({
      label,
      description,
      messages
    });

    onClose();
  };

  const getPreview = () => {
    if (!message.trim()) return 'Digite uma mensagem de apresentação...';

    let preview = message;
    if (askName && !message.includes('nome')) {
      preview += '\n\nQual o seu nome?';
    }

    return preview;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Apresentação Inicial
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure como a IA vai se apresentar ao cliente
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
              placeholder="Ex: Boas-vindas, Cumprimento inicial..."
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Este nome é só para você se organizar, o cliente não verá
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
              placeholder="Nesta etapa você irá se apresentar ao cliente e capturar o nome dele para personalizar a conversa."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Mensagem de apresentação */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-yellow-200 shadow-sm">
            <Label htmlFor="message" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensagem de apresentação
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Oi! Sou {nome_agente} da {empresa}. Estou aqui para te ajudar!"
              rows={4}
              className="resize-none text-base"
            />
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                💡 Dica: Use variáveis para personalizar
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {'{nome_agente}'}, {'{empresa}'} serão substituídos automaticamente
              </p>
            </div>
          </div>

          {/* Perguntar nome */}
          <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-800">
                  ❓ Perguntar o nome do cliente?
                </Label>
                <p className="text-sm text-gray-600">
                  ✅ Recomendado para personalizar a conversa
                </p>
              </div>
              <Switch
                checked={askName}
                onCheckedChange={setAskName}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 bg-gray-100 p-3 rounded-2xl rounded-tl-none">
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
                  tipo: 'initial_presentation',
                  descricao: description,
                  mensagem: [getPreview()],
                  decisoes: [
                    {
                      condicao: 'Sempre',
                      proximoPasso: 'PASSO B'
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
          <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold">
            ✅ Salvar Apresentação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
