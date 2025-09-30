import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap } from 'lucide-react';

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
  const [description, setDescription] = useState(initialData?.description || '');
  const [teachingContent, setTeachingContent] = useState(initialData?.teachingContent || '');
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
      teachingContent
    });

    onClose();
  };

  const getPreview = () => {
    if (!message.trim()) return 'Digite uma mensagem...';
    return message;
  };

  const isValid = () => {
    return message.trim().length > 0 && teachingContent.trim().length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Ensinar/Orientar
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure instruções e conhecimento para a IA usar na conversa
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
              placeholder="Ex: Explicar processo, Orientar sobre documentos..."
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
              placeholder="Nesta etapa você irá ensinar ao agente informações importantes sobre o processo para ele usar ao responder o cliente."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Conteúdo de ensino (para IA) */}
          <div className="space-y-3 bg-purple-50 p-6 rounded-xl border-2 border-purple-300 shadow-sm">
            <Label htmlFor="teachingContent" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              O que a IA precisa aprender? (contexto interno)
            </Label>
            <Textarea
              id="teachingContent"
              value={teachingContent}
              onChange={(e) => setTeachingContent(e.target.value)}
              placeholder="Ex: Para ser aprovado no empréstimo o cliente precisa ter renda comprovada acima de R$ 2.000, não pode ter restrições no CPF e precisa apresentar 3 documentos: RG, comprovante de renda e comprovante de residência."
              rows={6}
              className="resize-none text-base"
            />
            <div className="bg-purple-100 p-3 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">
                🤖 Isso é conhecimento INTERNO da IA
              </p>
              <p className="text-xs text-purple-600 mt-1">
                O cliente NÃO verá este conteúdo. A IA usará para responder perguntas e tomar decisões.
              </p>
            </div>
          </div>

          {/* Mensagem para o cliente */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
            <Label htmlFor="message" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensagem para o cliente (opcional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Vou te explicar como funciona o processo de análise de crédito..."
              rows={4}
              className="resize-none text-base"
            />
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                💡 Mensagem visível para o cliente
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Se quiser avisar que está explicando algo, escreva aqui. Senão, deixe em branco.
              </p>
            </div>
          </div>

          {/* Exemplo de uso */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplo de uso
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Contexto interno (IA):</strong></p>
              <p className="bg-white p-3 rounded-lg text-xs italic">
                "O prazo para análise é de 2 dias úteis. Se o cliente perguntar sobre urgência, informe que não é possível acelerar o processo, mas que ele receberá atualizações por e-mail."
              </p>
              <p className="mt-3"><strong>Mensagem ao cliente:</strong></p>
              <p className="bg-white p-3 rounded-lg text-xs italic">
                "Vou te explicar como funciona nossa análise de crédito. Pode me fazer perguntas!"
              </p>
            </div>
          </div>

          {/* Preview */}
          {message.trim() && (
            <div className="space-y-3 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-300">
              <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Como o cliente vai ver
              </Label>
              <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white text-xl">🤖</span>
                  </div>
                  <div className="flex-1 bg-purple-50 p-3 rounded-2xl rounded-tl-none">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{getPreview()}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                A IA também terá todo o conhecimento do "contexto interno" disponível
              </p>
            </div>
          )}

          {/* JSON Preview */}
          <details className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
              <span>🔧</span>
              <span>Ver estrutura técnica (JSON)</span>
            </summary>
            <pre className="mt-3 p-4 bg-white rounded-lg overflow-auto text-xs border border-gray-200 shadow-inner">
              {JSON.stringify(
                {
                  tipo: 'teach',
                  descricao: description,
                  contexto_ia: teachingContent,
                  mensagem: message ? [message] : [],
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
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Ensinamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
