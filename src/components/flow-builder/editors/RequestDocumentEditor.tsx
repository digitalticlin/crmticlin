import { useState } from 'react';
import { MessageText, Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

interface RequestDocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description?: string;
    documentType?: string;
    timeout?: number;
    checkField?: string;
    saveVariable?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    decisions: Decision[];
    description: string;
    documentType: string;
    timeout: number;
    checkField?: string;
    saveVariable: string;
  }) => void;
}

export function RequestDocumentEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: RequestDocumentEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Solicitar Documento');
  const [description, setDescription] = useState(initialData?.description || '');
  const [documentType, setDocumentType] = useState(initialData?.documentType || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [checkIfSent, setCheckIfSent] = useState(!!initialData?.checkField);
  const [checkField, setCheckField] = useState(initialData?.checkField || '');
  const [timeout, setTimeout] = useState<number>(initialData?.timeout || 3600000); // 1 hora padrão
  const [saveVariable, setSaveVariable] = useState(initialData?.saveVariable || '');

  const handleSave = () => {
    const messages: MessageText[] = [
      {
        type: 'text',
        content: message,
        delay: 0
      }
    ];

    const decisions: Decision[] = [
      {
        id: `decision_${Date.now()}_0`,
        type: 'if_user_sends' as const,
        condition: 'documento_recebido',
        targetStepId: '',
        priority: 0,
        action: saveVariable || undefined
      },
      {
        id: `decision_${Date.now()}_1`,
        type: 'timeout' as const,
        condition: 'timeout',
        targetStepId: '',
        priority: 1
      }
    ];

    onSave({
      label,
      description,
      messages,
      decisions,
      documentType,
      timeout,
      checkField: checkIfSent ? checkField : undefined,
      saveVariable
    });

    onClose();
  };

  const getPreview = () => {
    if (!message.trim()) return 'Digite uma mensagem...';
    return message.replace('{documento}', documentType || '[documento]');
  };

  const isValid = () => {
    return message.trim().length > 0 && documentType.trim().length > 0 && saveVariable.trim().length > 0;
  };

  const getTimeoutLabel = (ms: number) => {
    switch (ms) {
      case 300000: return '5 minutos';
      case 1800000: return '30 minutos';
      case 3600000: return '1 hora';
      case 21600000: return '6 horas';
      case 86400000: return '1 dia';
      case 0: return 'Sem limite';
      default: return `${ms / 1000}s`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-blue-600 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Solicitar Documento
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configure a solicitação de documentos e aguarde o envio
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
              placeholder="Ex: Pedir RG, Solicitar comprovante de renda..."
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
              placeholder="Nesta etapa você irá solicitar um documento específico e aguardar até o cliente enviar ou o tempo expirar."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Tipo de documento */}
          <div className="space-y-2 bg-white p-4 rounded-xl border-2 border-orange-200 shadow-sm">
            <Label htmlFor="documentType" className="text-base font-semibold text-gray-700">
              📄 Qual documento você quer pedir?
            </Label>
            <Input
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="Ex: RG, CPF, Comprovante de renda, Extrato bancário..."
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Use a variável {'{documento}'} na mensagem abaixo
            </p>
          </div>

          {/* Mensagem de solicitação */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
            <Label htmlFor="message" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Como pedir o documento?
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Por favor, me envie uma foto do seu {documento} para prosseguirmos."
              rows={3}
              className="resize-none text-base"
            />
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                💡 Use {'{documento}'} na mensagem
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Será substituído automaticamente pelo tipo de documento
              </p>
            </div>
          </div>

          {/* Verificar se já enviou */}
          <div className="bg-amber-50 p-5 rounded-xl border-2 border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <Label className="text-base font-semibold text-gray-800">
                  🔍 Verificar se já enviou antes?
                </Label>
                <p className="text-sm text-gray-600">
                  Evita pedir o mesmo documento duas vezes
                </p>
              </div>
              <Switch
                checked={checkIfSent}
                onCheckedChange={setCheckIfSent}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>

            {checkIfSent && (
              <div className="space-y-2 mt-4 p-4 bg-white rounded-lg">
                <Label htmlFor="checkField" className="text-sm font-medium text-gray-700">
                  Qual informação verificar?
                </Label>
                <Input
                  id="checkField"
                  value={checkField}
                  onChange={(e) => setCheckField(e.target.value)}
                  placeholder="Ex: tem_rg, enviou_comprovante, documento_recebido"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Se esta informação já existir, a IA pula esta solicitação
                </p>
              </div>
            )}
          </div>

          {/* Tempo máximo de espera */}
          <div className="space-y-3 bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200">
            <Label htmlFor="timeout" className="text-base font-semibold text-gray-800">
              ⏱️ Tempo máximo de espera
            </Label>
            <Select value={timeout.toString()} onValueChange={(value) => setTimeout(Number(value))}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300000">5 minutos</SelectItem>
                <SelectItem value="1800000">30 minutos</SelectItem>
                <SelectItem value="3600000">1 hora</SelectItem>
                <SelectItem value="21600000">6 horas</SelectItem>
                <SelectItem value="86400000">1 dia</SelectItem>
                <SelectItem value="0">Sem limite (aguardar indefinidamente)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-indigo-600">
              Se o cliente não enviar neste tempo, seguirá pelo caminho "timeout"
            </p>
          </div>

          {/* Guardar arquivo em */}
          <div className="space-y-2 bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
            <Label htmlFor="saveVariable" className="text-base font-semibold text-gray-700">
              💾 Guardar arquivo recebido em:
            </Label>
            <Input
              id="saveVariable"
              value={saveVariable}
              onChange={(e) => setSaveVariable(e.target.value)}
              placeholder="Ex: arquivo_rg, documento_renda, comprovante_residencia"
              className="text-base"
            />
            <p className="text-xs text-purple-600">
              O arquivo será salvo nesta variável para uso posterior
            </p>
          </div>

          {/* Caminhos de decisão */}
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🔀</span>
              Caminhos possíveis
            </Label>

            <div className="space-y-3">
              {/* Documento recebido */}
              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-green-50 to-white border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    ✅ SE documento recebido
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Cliente enviou o arquivo → seguir para próximo passo (conectar no canvas)
                </p>
              </div>

              {/* Timeout */}
              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-red-50 to-white border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                    ⏱️ SE tempo esgotado
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Cliente não enviou no prazo de {getTimeoutLabel(timeout)} → seguir para outro passo
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              💡 Conecte os blocos no canvas para definir para onde ir em cada situação
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-orange-50 to-blue-50 p-6 rounded-xl border-2 border-orange-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 bg-orange-50 p-3 rounded-2xl rounded-tl-none">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{getPreview()}</p>
                </div>
              </div>
              {timeout > 0 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  ⏱️ Aguardará até {getTimeoutLabel(timeout)} pelo documento
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
                  tipo: 'request_document',
                  descricao: description,
                  documento: documentType,
                  validacao_previa: checkIfSent
                    ? {
                        campo: checkField,
                        operador: 'not_empty'
                      }
                    : undefined,
                  mensagem: [message],
                  timeout: timeout > 0 ? timeout : undefined,
                  salvar_em: saveVariable,
                  decisoes: [
                    {
                      condicao: 'documento_recebido',
                      proximoPasso: 'PRÓXIMO_A',
                      acao: `salvar em ${saveVariable}`
                    },
                    {
                      condicao: 'timeout',
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
            className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
