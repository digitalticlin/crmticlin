import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Edit3, Check } from 'lucide-react';

interface TeachEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    teachingContent?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    teachingContent: string;
  }) => void;
}

export function TeachEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: TeachEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Ensinar/Orientar');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [teachingContent, setTeachingContent] = useState(initialData?.teachingContent || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );

  const handleSave = () => {
    setIsEditingLabel(false);

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
      teachingContent
    });

    onClose();
  };

  const isValid = () => {
    return message.trim().length > 0 && teachingContent.trim().length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          {/* Header - Nome editável inline com ícone GraduationCap */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <GraduationCap className="h-6 w-6 text-white" />
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
              Ensine a IA como lidar com situações específicas
            </p>
          </div>

          {/* Conteúdo */}
          <div className="px-8 pb-8 space-y-6">
            {/* Descrição da etapa */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                O que deve acontecer nesta etapa?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Ensinar a IA sobre o processo de matrícula"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Conteúdo de ensino */}
            <div className="space-y-2">
              <Label htmlFor="teachingContent" className="text-sm font-medium text-gray-700">
                Conteúdo de ensino (para a IA)
              </Label>
              <Textarea
                id="teachingContent"
                value={teachingContent}
                onChange={(e) => setTeachingContent(e.target.value)}
                placeholder="Ex: O processo de matrícula tem 3 etapas: 1) Envio de documentos, 2) Análise, 3) Pagamento da taxa"
                rows={6}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                A IA vai usar esse conhecimento nas próximas conversas
              </p>
            </div>

            {/* Mensagem para o cliente */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Mensagem para o cliente (opcional)
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Deixa eu te explicar como funciona nosso processo..."
                rows={4}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Botões minimalistas */}
            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid()}
                className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
