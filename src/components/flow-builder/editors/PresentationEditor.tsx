import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Save, Eye, Code2, Lightbulb, MessageCircle, EyeOff } from 'lucide-react';

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
  const [label, setLabel] = useState(initialData?.label || 'Início');
  const [description, setDescription] = useState(initialData?.description || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [showPreview, setShowPreview] = useState(false);

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
      messages
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-2xl overflow-hidden">
        {/* Todo o conteúdo em scroll único */}
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          {/* Header integrado no conteúdo */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">Editar Bloco</h2>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Início
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Configure como a IA vai se apresentar ao cliente
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo do formulário */}
          <div className="px-8 pb-8 space-y-6">
            {/* Nome do bloco */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-100">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                Nome do bloco
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Boas-vindas"
                className="h-11 text-base bg-white/30 border-white/40 focus:border-green-500 focus:ring-green-500/20 rounded-xl placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                <Lightbulb className="h-3 w-3 text-gray-400" />
                Este nome é apenas para sua organização
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-100">
                  <Eye className="h-3.5 w-3.5 text-green-600" />
                </div>
                O que acontece nesta etapa?
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A IA se apresenta ao cliente e inicia a conversa..."
                rows={3}
                className="resize-none text-base bg-white/30 border-white/40 focus:border-green-500 focus:ring-green-500/20 rounded-xl placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                <Lightbulb className="h-3 w-3 text-gray-400" />
                A IA usa isso como contexto para executar a etapa
              </p>
            </div>

            {/* Mensagem da IA */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-100">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                Mensagem da IA
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá! Eu sou a assistente virtual. Como posso ajudar você hoje?"
                rows={6}
                className="resize-none text-base bg-white/30 border-white/40 focus:border-green-500 focus:ring-green-500/20 rounded-xl font-mono placeholder:text-gray-600"
              />

              {/* Variáveis disponíveis */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="h-4 w-4 text-green-700" />
                  <p className="text-xs font-semibold text-green-800">
                    Variáveis disponíveis
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <code className="px-2.5 py-1 bg-white border border-green-300 rounded-lg text-xs text-green-700 font-semibold shadow-sm">
                    {'{nome_agente}'}
                  </code>
                  <code className="px-2.5 py-1 bg-white border border-green-300 rounded-lg text-xs text-green-700 font-semibold shadow-sm">
                    {'{empresa}'}
                  </code>
                  <code className="px-2.5 py-1 bg-white border border-green-300 rounded-lg text-xs text-green-700 font-semibold shadow-sm">
                    {'{nome_cliente}'}
                  </code>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 group"
              >
                <div className="flex items-center gap-2">
                  {showPreview ? (
                    <EyeOff className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {showPreview ? 'Ocultar prévia' : 'Ver como o cliente vai receber'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {showPreview ? '▼' : '▶'}
                </span>
              </button>

              {showPreview && message && (
                <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Prévia da Mensagem
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-200">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ações - Integradas no conteúdo */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 border-gray-300 hover:bg-gray-50 rounded-xl font-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
