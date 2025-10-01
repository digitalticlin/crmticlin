import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link as LinkIcon } from 'lucide-react';

interface SendLinkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    linkUrl?: string;
    linkTitle?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    linkUrl: string;
    linkTitle: string;
  }) => void;
}

export function SendLinkEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: SendLinkEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Enviar Link');
  const [description, setDescription] = useState(initialData?.description || '');
  const [linkUrl, setLinkUrl] = useState(initialData?.linkUrl || '');
  const [linkTitle, setLinkTitle] = useState(initialData?.linkTitle || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );

  const handleSave = () => {
    const messages: MessageText[] = [
      {
        type: 'text',
        content: message,
        delay: 0
      }
    ];

    onSave({
      label,
      description,
      messages,
      linkUrl,
      linkTitle
    });

    onClose();
  };

  const isValid = () => {
    return message.trim().length > 0 && linkUrl.trim().length > 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-cyan-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <LinkIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Enviar Link
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Compartilhe um link formatado com o cliente
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
              placeholder="Ex: Enviar link do produto, Compartilhar catálogo..."
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
              placeholder="Nesta etapa você irá enviar o link do catálogo de produtos para o cliente visualizar."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* URL do Link */}
          <div className="space-y-2 bg-cyan-50 p-4 rounded-xl border-2 border-cyan-200 shadow-sm">
            <Label htmlFor="linkUrl" className="text-base font-semibold text-gray-700">
              🔗 URL do Link
            </Label>
            <Input
              id="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://exemplo.com/produto"
              className="text-base font-mono"
              type="url"
            />
            {linkUrl && !isValidUrl(linkUrl) && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                ⚠️ URL inválida. Use o formato completo: https://...
              </p>
            )}
            {linkUrl && isValidUrl(linkUrl) && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                ✅ URL válida
              </p>
            )}
          </div>

          {/* Título do Link (opcional) */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="linkTitle" className="text-base font-semibold text-gray-700">
              🏷️ Título do Link (opcional)
            </Label>
            <Input
              id="linkTitle"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Ex: Catálogo de Produtos 2024"
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Se deixar vazio, mostrará a URL
            </p>
          </div>

          {/* Mensagem */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
            <Label htmlFor="message" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensagem que acompanha o link
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Aqui está o link do nosso catálogo! Dá uma olhada e me conta o que achou 😊"
              rows={4}
              className="resize-none text-base"
            />
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                💡 Dica: Seja convidativo
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Incentive o cliente a clicar no link e interagir
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border-2 border-cyan-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 space-y-2">
                  {/* Mensagem */}
                  <div className="bg-cyan-50 p-3 rounded-2xl rounded-tl-none">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {message || 'Digite uma mensagem...'}
                    </p>
                  </div>
                  {/* Link Card */}
                  {linkUrl && (
                    <div className="bg-white border-2 border-cyan-200 rounded-xl p-4 hover:bg-cyan-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <LinkIcon className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {linkTitle || 'Link'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {linkUrl}
                          </p>
                        </div>
                        <div className="text-cyan-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info sobre links */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Dicas para enviar links
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Use URLs curtas e confiáveis</p>
              <p>• Adicione um título descritivo para aumentar cliques</p>
              <p>• Explique o que o cliente vai encontrar no link</p>
              <p>• Teste o link antes de enviar ao cliente</p>
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
                  tipo: 'send_link',
                  descricao: description,
                  mensagem: [message],
                  link: {
                    url: linkUrl,
                    titulo: linkTitle || linkUrl
                  },
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
            disabled={!isValid() || !isValidUrl(linkUrl)}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
