import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck } from 'lucide-react';

interface TransferHumanEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    department?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    notifyMessage?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    department: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    notifyMessage: string;
  }) => void;
}

export function TransferHumanEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: TransferHumanEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Encaminhar para Humano');
  const [description, setDescription] = useState(initialData?.description || '');
  const [department, setDepartment] = useState(initialData?.department || 'vendas');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(
    initialData?.priority || 'medium'
  );
  const [notifyMessage, setNotifyMessage] = useState(
    initialData?.notifyMessage || 'Vou transferir você para um atendente humano. Aguarde um momento.'
  );

  const handleSave = () => {
    const messages: MessageText[] = [
      {
        type: 'text',
        content: notifyMessage,
        delay: 0
      }
    ];

    onSave({
      label,
      description,
      messages,
      department,
      priority,
      notifyMessage
    });

    onClose();
  };

  const isValid = () => {
    return department.trim().length > 0 && notifyMessage.trim().length > 0;
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (p: string) => {
    switch (p) {
      case 'low': return '🔵 Baixa';
      case 'medium': return '🟢 Média';
      case 'high': return '🟠 Alta';
      case 'urgent': return '🔴 Urgente';
      default: return p;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Encaminhar para Humano
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Transfira a conversa para um atendente humano
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
              placeholder="Ex: Transferir para vendas, Escalar para suporte, Passar para gerente..."
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
              placeholder="Nesta etapa você irá transferir o atendimento para um humano, encerrando a automação e passando o contexto da conversa."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre transferência */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              Como funciona a transferência?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Envia mensagem</strong> avisando o cliente</p>
              <p>• Notifica o departamento escolhido</p>
              <p>• Passa todo o histórico da conversa</p>
              <p>• A automação é pausada até o atendente assumir</p>
            </div>
          </div>

          {/* Departamento */}
          <div className="space-y-3 bg-orange-50 p-6 rounded-xl border-2 border-orange-200 shadow-sm">
            <Label htmlFor="department" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              Para qual departamento transferir?
            </Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="bg-white text-base">
                <SelectValue placeholder="Selecione o departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendas">💼 Vendas</SelectItem>
                <SelectItem value="suporte">🛠️ Suporte Técnico</SelectItem>
                <SelectItem value="financeiro">💰 Financeiro</SelectItem>
                <SelectItem value="comercial">📊 Comercial</SelectItem>
                <SelectItem value="atendimento">👥 Atendimento Geral</SelectItem>
                <SelectItem value="gerencia">👔 Gerência</SelectItem>
                <SelectItem value="custom">✏️ Departamento personalizado</SelectItem>
              </SelectContent>
            </Select>

            {department === 'custom' && (
              <div className="mt-3">
                <Input
                  placeholder="Nome do departamento personalizado"
                  className="text-sm"
                  onChange={(e) => setDepartment(e.target.value === '' ? 'custom' : e.target.value)}
                />
              </div>
            )}

            <p className="text-sm text-orange-600">
              Este departamento receberá notificação para assumir o atendimento
            </p>
          </div>

          {/* Prioridade */}
          <div className="space-y-3 bg-red-50 p-6 rounded-xl border-2 border-red-200 shadow-sm">
            <Label htmlFor="priority" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              Qual a prioridade do atendimento?
            </Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger className="bg-white text-base">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🔵 Baixa - Atendimento normal</SelectItem>
                <SelectItem value="medium">🟢 Média - Atenção padrão</SelectItem>
                <SelectItem value="high">🟠 Alta - Atender com prioridade</SelectItem>
                <SelectItem value="urgent">🔴 Urgente - Atender imediatamente</SelectItem>
              </SelectContent>
            </Select>
            <div className={`mt-3 p-3 rounded-lg border-2 ${getPriorityColor(priority)}`}>
              <p className="text-sm font-semibold">
                Prioridade selecionada: {getPriorityLabel(priority)}
              </p>
            </div>
          </div>

          {/* Mensagem ao cliente */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
            <Label htmlFor="notifyMessage" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensagem para o cliente
            </Label>
            <Textarea
              id="notifyMessage"
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Vou transferir você para um atendente humano. Aguarde um momento."
              rows={3}
              className="resize-none text-base"
            />
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                💡 Seja educado e transparente
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Informe que a conversa será transferida e que um humano assumirá em breve
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 bg-orange-50 p-3 rounded-2xl rounded-tl-none">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{notifyMessage}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-center">
                <p className="text-xs font-semibold text-yellow-800">
                  ⏳ Aguardando atendente do departamento de {department !== 'custom' ? department : 'personalizado'}
                </p>
              </div>
            </div>
          </div>

          {/* Info para a equipe */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">📋</span>
              O que a equipe receberá
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">✅ Histórico completo</p>
                <p className="text-xs text-gray-600">Todas as mensagens trocadas até agora</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">✅ Dados coletados</p>
                <p className="text-xs text-gray-600">Informações capturadas durante o fluxo (nome, CPF, etc)</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-purple-700 mb-1">✅ Contexto da situação</p>
                <p className="text-xs text-gray-600">Motivo da transferência e próximos passos sugeridos</p>
              </div>
            </div>
          </div>

          {/* Quando usar */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Quando transferir para humano?
            </Label>
            <div className="space-y-2 text-sm">
              <p className="bg-white p-3 rounded-lg">
                <strong>✓ Solicitação do cliente:</strong> Quando pede para falar com humano
              </p>
              <p className="bg-white p-3 rounded-lg">
                <strong>✓ Situação complexa:</strong> IA não consegue resolver
              </p>
              <p className="bg-white p-3 rounded-lg">
                <strong>✓ Negociação:</strong> Valores, contratos, propostas personalizadas
              </p>
              <p className="bg-white p-3 rounded-lg">
                <strong>✓ Múltiplas tentativas:</strong> Após várias tentativas sem sucesso
              </p>
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
                  tipo: 'transfer_human',
                  descricao: description,
                  departamento: department,
                  prioridade: priority,
                  mensagem: [notifyMessage],
                  decisoes: [
                    {
                      condicao: 'transferência_realizada',
                      proximoPasso: 'FIM'
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
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
