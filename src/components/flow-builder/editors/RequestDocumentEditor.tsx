import { useState } from 'react';
import { MessageText, Decision } from '@/types/flowBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Edit3, Check, ArrowRight } from 'lucide-react';

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
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [documentType, setDocumentType] = useState(initialData?.documentType || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [checkIfSent, setCheckIfSent] = useState(!!initialData?.checkField);
  const [checkField, setCheckField] = useState(initialData?.checkField || '');
  const [timeout, setTimeout] = useState<number>(initialData?.timeout || 3600000);
  const [saveVariable, setSaveVariable] = useState(initialData?.saveVariable || '');

  const handleSave = () => {
    setIsEditingLabel(false);

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
        outputHandle: 'output-0',
        action: saveVariable || undefined
      },
      {
        id: `decision_${Date.now()}_1`,
        type: 'timeout' as const,
        condition: 'timeout',
        targetStepId: '',
        priority: 1,
        outputHandle: 'output-1'
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          {/* Header - Nome editável inline com ícone FileText */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
                <FileText className="h-6 w-6 text-white" />
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
              Solicite um documento e aguarde o envio
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
                placeholder="Ex: Solicitar RG do cliente e aguardar envio"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Tipo de documento */}
            <div className="space-y-2">
              <Label htmlFor="documentType" className="text-sm font-medium text-gray-700">
                Qual documento você quer pedir?
              </Label>
              <Input
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="Ex: RG, CPF, Comprovante de renda"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Use a variável {'{documento}'} na mensagem abaixo
              </p>
            </div>

            {/* Mensagem de solicitação */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Como pedir o documento?
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Por favor, me envie uma foto do seu {documento}"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Verificar se já enviou */}
            <div className="bg-white/30 border border-white/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    Verificar se já enviou antes?
                  </Label>
                  <p className="text-xs text-gray-600">
                    Evita pedir o mesmo documento duas vezes
                  </p>
                </div>
                <Switch
                  checked={checkIfSent}
                  onCheckedChange={setCheckIfSent}
                />
              </div>

              {checkIfSent && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="checkField" className="text-xs font-medium text-gray-700">
                    Qual informação verificar?
                  </Label>
                  <Input
                    id="checkField"
                    value={checkField}
                    onChange={(e) => setCheckField(e.target.value)}
                    placeholder="Ex: tem_rg, enviou_comprovante"
                    className="bg-white/50 border-white/40 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Tempo máximo de espera */}
            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-sm font-medium text-gray-700">
                Tempo máximo de espera
              </Label>
              <Select value={timeout.toString()} onValueChange={(value) => setTimeout(Number(value))}>
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300000">5 minutos</SelectItem>
                  <SelectItem value="1800000">30 minutos</SelectItem>
                  <SelectItem value="3600000">1 hora</SelectItem>
                  <SelectItem value="21600000">6 horas</SelectItem>
                  <SelectItem value="86400000">1 dia</SelectItem>
                  <SelectItem value="0">Sem limite</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Se não enviar neste tempo, seguirá pelo caminho "timeout"
              </p>
            </div>

            {/* Guardar arquivo em */}
            <div className="space-y-2">
              <Label htmlFor="saveVariable" className="text-sm font-medium text-gray-700">
                Guardar arquivo recebido em
              </Label>
              <Input
                id="saveVariable"
                value={saveVariable}
                onChange={(e) => setSaveVariable(e.target.value)}
                placeholder="Ex: arquivo_rg, documento_renda"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                O arquivo será salvo nesta variável
              </p>
            </div>

            {/* Outputs */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Saídas possíveis</Label>

              {/* Output 1 - Documento recebido */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-700 text-sm">SAÍDA 1</span>
                      <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-600">SE documento recebido</p>
                  </div>
                </div>
              </div>

              {/* Output 2 - Timeout */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-red-700 text-sm">SAÍDA 2</span>
                      <ArrowRight className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <p className="text-xs text-gray-600">SE tempo esgotado ({getTimeoutLabel(timeout)})</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Conecte no canvas ao próximo bloco
              </p>
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
                
                className="px-6 py-2.5 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-full text-sm font-medium shadow-lg shadow-orange-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
