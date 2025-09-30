import { useState } from 'react';
import { MessageText, Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck } from 'lucide-react';

interface ValidateDocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description?: string;
    documentVariable?: string;
    validationCriteria?: string;
    autoValidate?: boolean;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description: string;
    documentVariable: string;
    validationCriteria: string;
    autoValidate: boolean;
  }) => void;
}

export function ValidateDocumentEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: ValidateDocumentEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Validar Documento');
  const [description, setDescription] = useState(initialData?.description || '');
  const [documentVariable, setDocumentVariable] = useState(initialData?.documentVariable || '');
  const [validationCriteria, setValidationCriteria] = useState(initialData?.validationCriteria || '');
  const [autoValidate, setAutoValidate] = useState(initialData?.autoValidate ?? true);
  const [validMessage, setValidMessage] = useState('');
  const [invalidMessage, setInvalidMessage] = useState('');

  const handleSave = () => {
    const messages: MessageText[] = [];

    if (validMessage.trim()) {
      messages.push({
        type: 'text',
        content: validMessage,
        delay: 0
      });
    }

    const decisions: Decision[] = [
      {
        id: `decision_${Date.now()}_0`,
        type: 'validation' as const,
        condition: 'documento_válido',
        targetStepId: '',
        priority: 0
      },
      {
        id: `decision_${Date.now()}_1`,
        type: 'validation' as const,
        condition: 'documento_inválido',
        targetStepId: '',
        priority: 1
      }
    ];

    onSave({
      label,
      description,
      messages,
      decisions,
      documentVariable,
      validationCriteria,
      autoValidate
    });

    onClose();
  };

  const isValid = () => {
    return documentVariable.trim().length > 0 && validationCriteria.trim().length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-green-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Validar Documento
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure a validação de documentos recebidos
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
              placeholder="Ex: Validar RG, Conferir comprovante, Verificar documento..."
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
              placeholder="Nesta etapa você irá validar o documento enviado pelo cliente verificando se atende aos critérios necessários."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Documento a validar */}
          <div className="space-y-2 bg-white p-4 rounded-xl border-2 border-green-200 shadow-sm">
            <Label htmlFor="documentVariable" className="text-base font-semibold text-gray-700">
              📄 Qual documento validar?
            </Label>
            <Input
              id="documentVariable"
              value={documentVariable}
              onChange={(e) => setDocumentVariable(e.target.value)}
              placeholder="Ex: arquivo_rg, documento_renda, comprovante_residencia"
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Nome da variável onde o documento foi salvo anteriormente
            </p>
          </div>

          {/* Critérios de validação */}
          <div className="space-y-3 bg-emerald-50 p-6 rounded-xl border-2 border-emerald-200 shadow-sm">
            <Label htmlFor="validationCriteria" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              O que verificar no documento?
            </Label>
            <Textarea
              id="validationCriteria"
              value={validationCriteria}
              onChange={(e) => setValidationCriteria(e.target.value)}
              placeholder="Ex: Verificar se o RG está legível, se todos os campos estão visíveis (nome, RG, CPF, data de nascimento), se a foto está nítida e se não está vencido."
              rows={5}
              className="resize-none text-base"
            />
            <div className="bg-emerald-100 p-3 rounded-lg">
              <p className="text-sm text-emerald-800 font-medium">
                🤖 A IA usará estes critérios para avaliar
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Seja específico sobre o que torna um documento válido ou inválido
              </p>
            </div>
          </div>

          {/* Modo de validação */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <Label className="text-base font-semibold text-gray-800">
                  🤖 Validação automática pela IA?
                </Label>
                <p className="text-sm text-gray-600">
                  ✅ Recomendado: A IA analisa automaticamente
                </p>
                <p className="text-xs text-gray-500">
                  ❌ Desligado: Aguarda validação manual humana
                </p>
              </div>
              <Switch
                checked={autoValidate}
                onCheckedChange={setAutoValidate}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          {/* Mensagens (opcionais) */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensagens para o cliente (opcional)
            </Label>

            <div className="space-y-2">
              <Label htmlFor="validMessage" className="text-sm font-medium text-gray-700">
                ✅ SE documento válido:
              </Label>
              <Textarea
                id="validMessage"
                value={validMessage}
                onChange={(e) => setValidMessage(e.target.value)}
                placeholder="Ex: Ótimo! Seu documento foi validado com sucesso."
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invalidMessage" className="text-sm font-medium text-gray-700">
                ❌ SE documento inválido:
              </Label>
              <Textarea
                id="invalidMessage"
                value={invalidMessage}
                onChange={(e) => setInvalidMessage(e.target.value)}
                placeholder="Ex: Desculpe, seu documento não está legível. Pode enviar outra foto?"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <p className="text-xs text-gray-500">
              💡 Deixe em branco se não quiser enviar mensagens automáticas
            </p>
          </div>

          {/* Caminhos de decisão */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🔀</span>
              Caminhos possíveis
            </Label>

            <div className="space-y-3">
              {/* Documento válido */}
              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-green-50 to-white border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    ✅ SE documento válido
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Documento passou na validação → seguir para próximo passo (conectar no canvas)
                </p>
              </div>

              {/* Documento inválido */}
              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-red-50 to-white border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                    ❌ SE documento inválido
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Documento não passou na validação → pode pedir novamente ou seguir outro caminho
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              💡 Conecte os blocos no canvas para definir para onde ir em cada situação
            </p>
          </div>

          {/* Preview com mensagens */}
          {(validMessage.trim() || invalidMessage.trim()) && (
            <div className="space-y-3 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
              <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Como o cliente vai ver
              </Label>

              {validMessage.trim() && (
                <div className="bg-white p-4 rounded-2xl shadow-md border border-green-200 mb-3">
                  <p className="text-xs text-green-700 font-semibold mb-2">Quando válido:</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white text-xl">✅</span>
                    </div>
                    <div className="flex-1 bg-green-50 p-3 rounded-2xl rounded-tl-none">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{validMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {invalidMessage.trim() && (
                <div className="bg-white p-4 rounded-2xl shadow-md border border-red-200">
                  <p className="text-xs text-red-700 font-semibold mb-2">Quando inválido:</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white text-xl">❌</span>
                    </div>
                    <div className="flex-1 bg-red-50 p-3 rounded-2xl rounded-tl-none">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{invalidMessage}</p>
                    </div>
                  </div>
                </div>
              )}
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
                  tipo: 'validate_document',
                  descricao: description,
                  documento_variavel: documentVariable,
                  criterios_validacao: validationCriteria,
                  validacao_automatica: autoValidate,
                  mensagens: {
                    valido: validMessage || undefined,
                    invalido: invalidMessage || undefined
                  },
                  decisoes: [
                    {
                      condicao: 'documento_válido',
                      proximoPasso: 'PRÓXIMO_A'
                    },
                    {
                      condicao: 'documento_inválido',
                      proximoPasso: 'PRÓXIMO_B'
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
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Validação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
