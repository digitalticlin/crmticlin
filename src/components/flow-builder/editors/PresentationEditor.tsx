import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play, Check, Lightbulb, MessageCircle, Edit3, Plus, Trash2 } from 'lucide-react';

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
  const [messageExamples, setMessageExamples] = useState<string[]>(
    initialData?.messages.map(m => m.type === 'text' ? m.content : '').filter(Boolean) || ['']
  );
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const addMessageExample = () => {
    setMessageExamples([...messageExamples, '']);
  };

  const removeMessageExample = (index: number) => {
    if (messageExamples.length > 1) {
      setMessageExamples(messageExamples.filter((_, i) => i !== index));
    }
  };

  const updateMessageExample = (index: number, value: string) => {
    const newExamples = [...messageExamples];
    newExamples[index] = value;
    setMessageExamples(newExamples);
  };

  const handleSave = () => {
    const messages: MessageText[] = messageExamples
      .filter(content => content.trim())
      .map(content => ({
        type: 'text' as const,
        content,
        delay: 0
      }));

    onSave({
      label,
      description,
      messages
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        {/* Todo o conteúdo em scroll único */}
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          {/* Header integrado no conteúdo */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                {isEditingLabel ? (
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
                    autoFocus
                    className="h-10 text-xl font-bold bg-white/30 border-white/40 focus:border-green-500 rounded-xl"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingLabel(true)}
                      className="h-8 w-8 rounded-lg hover:bg-white/40"
                    >
                      <Edit3 className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo do formulário */}
          <div className="px-8 pb-8 space-y-6">
            {/* Descrição */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-100">
                  <Lightbulb className="h-3.5 w-3.5 text-green-600" />
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

            {/* Mensagens da IA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-100">
                    <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Mensagem da IA
                </Label>
                <button
                  onClick={addMessageExample}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-ticlin-600 hover:text-ticlin-700 bg-white/30 hover:bg-white/50 border border-white/40 rounded-full transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar exemplo
                </button>
              </div>

              <p className="text-xs text-gray-600">
                Cite exemplos de mensagens para IA usar
              </p>

              <div className="space-y-3">
                {messageExamples.map((example, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={example}
                      onChange={(e) => updateMessageExample(index, e.target.value)}
                      placeholder={`Exemplo ${index + 1}: Olá, como posso te ajudar?`}
                      rows={3}
                      className="flex-1 resize-none text-base bg-white/30 border-white/40 focus:border-green-500 focus:ring-green-500/20 rounded-xl font-mono placeholder:text-gray-600"
                    />
                    {messageExamples.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMessageExample(index)}
                        className="h-10 w-10 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ações - Ultra Minimalistas */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/40 mt-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white/30 hover:bg-white/50 border border-white/40 rounded-full transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-ticlin-500 hover:bg-ticlin-600 border border-ticlin-600 rounded-full transition-all shadow-sm"
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
