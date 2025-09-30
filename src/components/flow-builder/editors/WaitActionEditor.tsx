import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface WaitActionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    waitType?: 'time' | 'user_action' | 'condition';
    waitDuration?: number;
    waitCondition?: string;
  };
  onSave: (data: {
    label: string;
    description: string;
    waitType: 'time' | 'user_action' | 'condition';
    waitDuration?: number;
    waitCondition?: string;
  }) => void;
}

export function WaitActionEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: WaitActionEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Aguardar Ação');
  const [description, setDescription] = useState(initialData?.description || '');
  const [waitType, setWaitType] = useState<'time' | 'user_action' | 'condition'>(
    initialData?.waitType || 'time'
  );
  const [waitDuration, setWaitDuration] = useState<number>(initialData?.waitDuration || 3600000);
  const [waitCondition, setWaitCondition] = useState(initialData?.waitCondition || '');

  const handleSave = () => {
    onSave({
      label,
      description,
      waitType,
      waitDuration: waitType === 'time' ? waitDuration : undefined,
      waitCondition: waitType !== 'time' ? waitCondition : undefined
    });

    onClose();
  };

  const isValid = () => {
    if (waitType === 'time') return true;
    return waitCondition.trim().length > 0;
  };

  const getTimeLabel = (ms: number) => {
    if (ms < 60000) return `${ms / 1000} segundos`;
    if (ms < 3600000) return `${ms / 60000} minutos`;
    if (ms < 86400000) return `${ms / 3600000} horas`;
    return `${ms / 86400000} dias`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Aguardar Ação
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Pause o fluxo e aguarde um tempo ou ação específica
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
              placeholder="Ex: Aguardar resposta, Esperar 1 dia, Pausar até confirmação..."
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
              placeholder="Nesta etapa você irá pausar o fluxo aguardando um período de tempo ou uma ação específica do cliente antes de continuar."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre aguardar */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              Como funciona o aguardar?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>NÃO envia mensagens</strong> ao cliente</p>
              <p>• Pausa o fluxo temporariamente</p>
              <p>• Útil para dar tempo ao cliente ou esperar uma ação externa</p>
              <p>• Pode aguardar por tempo fixo ou evento específico</p>
            </div>
          </div>

          {/* Tipo de espera */}
          <div className="space-y-3 bg-slate-50 p-6 rounded-xl border-2 border-slate-200 shadow-sm">
            <Label htmlFor="waitType" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">⏳</span>
              O que aguardar?
            </Label>
            <Select value={waitType} onValueChange={(value: any) => setWaitType(value)}>
              <SelectTrigger className="bg-white text-base">
                <SelectValue placeholder="Selecione o tipo de espera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">⏰ Aguardar um tempo fixo</SelectItem>
                <SelectItem value="user_action">👤 Aguardar ação do cliente</SelectItem>
                <SelectItem value="condition">✅ Aguardar condição específica</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600">
              {waitType === 'time' && '⏰ O fluxo continuará após o tempo definido'}
              {waitType === 'user_action' && '👤 O fluxo continuará quando o cliente responder ou agir'}
              {waitType === 'condition' && '✅ O fluxo continuará quando a condição for verdadeira'}
            </p>
          </div>

          {/* Configuração baseada no tipo */}
          {waitType === 'time' && (
            <div className="space-y-3 bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200">
              <Label htmlFor="waitDuration" className="text-base font-semibold text-gray-800">
                ⏱️ Quanto tempo aguardar?
              </Label>
              <Select value={waitDuration.toString()} onValueChange={(value) => setWaitDuration(Number(value))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30000">30 segundos</SelectItem>
                  <SelectItem value="60000">1 minuto</SelectItem>
                  <SelectItem value="300000">5 minutos</SelectItem>
                  <SelectItem value="1800000">30 minutos</SelectItem>
                  <SelectItem value="3600000">1 hora</SelectItem>
                  <SelectItem value="21600000">6 horas</SelectItem>
                  <SelectItem value="86400000">1 dia</SelectItem>
                  <SelectItem value="259200000">3 dias</SelectItem>
                  <SelectItem value="604800000">1 semana</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-indigo-600">
                Após {getTimeLabel(waitDuration)}, o fluxo continuará automaticamente
              </p>
            </div>
          )}

          {waitType === 'user_action' && (
            <div className="space-y-3 bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
              <Label htmlFor="waitCondition" className="text-base font-semibold text-gray-800">
                👤 Qual ação do cliente aguardar?
              </Label>
              <Textarea
                id="waitCondition"
                value={waitCondition}
                onChange={(e) => setWaitCondition(e.target.value)}
                placeholder="Ex: cliente enviar uma mensagem, cliente enviar um arquivo, cliente clicar em um botão"
                rows={3}
                className="resize-none text-base"
              />
              <p className="text-sm text-purple-600">
                O fluxo ficará pausado até o cliente realizar esta ação
              </p>
            </div>
          )}

          {waitType === 'condition' && (
            <div className="space-y-3 bg-green-50 p-5 rounded-xl border-2 border-green-200">
              <Label htmlFor="waitCondition" className="text-base font-semibold text-gray-800">
                ✅ Qual condição aguardar?
              </Label>
              <Textarea
                id="waitCondition"
                value={waitCondition}
                onChange={(e) => setWaitCondition(e.target.value)}
                placeholder="Ex: pagamento_confirmado == true, documento_validado == true, aprovacao_gerente == true"
                rows={3}
                className="resize-none text-base"
              />
              <p className="text-sm text-green-600">
                O fluxo ficará pausado até esta condição ser verdadeira
              </p>
            </div>
          )}

          {/* Exemplos práticos */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplos de uso
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">⏰ Aguardar tempo:</p>
                <p className="text-xs text-gray-600">
                  "Esperar 1 dia para dar follow-up no lead que não respondeu"
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">👤 Aguardar ação:</p>
                <p className="text-xs text-gray-600">
                  "Aguardar cliente enviar documento solicitado"
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">✅ Aguardar condição:</p>
                <p className="text-xs text-gray-600">
                  "Aguardar aprovação do gerente no sistema antes de continuar"
                </p>
              </div>
            </div>
          </div>

          {/* Visual da espera */}
          <div className="space-y-3 bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-xl border-2 border-slate-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">⏸️</span>
              Como funciona na prática
            </Label>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <div className="bg-blue-100 px-4 py-3 rounded-lg border-2 border-blue-400 mb-2">
                    <p className="text-sm font-bold text-blue-700">Passo anterior</p>
                  </div>
                  <p className="text-xs text-gray-500">Executa normalmente</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Clock className="h-8 w-8 text-slate-500 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-700">
                    {waitType === 'time' && getTimeLabel(waitDuration)}
                    {waitType === 'user_action' && 'Aguardando...'}
                    {waitType === 'condition' && 'Verificando...'}
                  </p>
                </div>

                <div className="flex-1 text-center">
                  <div className="bg-green-100 px-4 py-3 rounded-lg border-2 border-green-400 mb-2">
                    <p className="text-sm font-bold text-green-700">Próximo passo</p>
                  </div>
                  <p className="text-xs text-gray-500">Continua após espera</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 bg-slate-100 p-2 rounded">
              ⚠️ Durante a espera, o fluxo fica pausado mas o cliente pode continuar conversando normalmente
            </p>
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
                  tipo: 'wait_action',
                  descricao: description,
                  tipo_espera: waitType,
                  duracao: waitType === 'time' ? waitDuration : undefined,
                  condicao: waitType !== 'time' ? waitCondition : undefined,
                  mensagem: [], // Sem mensagens
                  decisoes: [
                    {
                      condicao: 'espera_concluída',
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
            className="flex-1 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Espera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
