import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';

interface MoveFunnelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    targetStage?: string;
    notifyUser?: boolean;
  };
  onSave: (data: {
    label: string;
    description: string;
    targetStage: string;
    notifyUser: boolean;
  }) => void;
}

export function MoveFunnelEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: MoveFunnelEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Mover Lead no Funil');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetStage, setTargetStage] = useState(initialData?.targetStage || '');
  const [notifyUser, setNotifyUser] = useState(initialData?.notifyUser ?? false);

  const handleSave = () => {
    onSave({
      label,
      description,
      targetStage,
      notifyUser
    });

    onClose();
  };

  const isValid = () => {
    return targetStage.trim().length > 0;
  };

  // Stages comuns de funil (exemplos)
  const commonStages = [
    { value: 'lead', label: 'Lead (novo contato)' },
    { value: 'contato_feito', label: 'Contato Feito' },
    { value: 'qualificado', label: 'Qualificado' },
    { value: 'proposta', label: 'Proposta Enviada' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'ganho', label: 'Ganho (Cliente)' },
    { value: 'perdido', label: 'Perdido' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-indigo-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Mover Lead no Funil
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Mova o lead para outra etapa do funil de vendas
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
              placeholder="Ex: Marcar como qualificado, Mover para proposta, Fechar negócio..."
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
              placeholder="Nesta etapa você irá mover o lead para outra fase do funil de vendas de acordo com o progresso da conversa."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Info sobre movimentação */}
          <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">ℹ️</span>
              Como funciona a movimentação no funil?
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>NÃO envia mensagens</strong> ao cliente (por padrão)</p>
              <p>• Move o lead para outra etapa do funil de vendas</p>
              <p>• Útil para organizar o progresso dos leads</p>
              <p>• Permite automações e gatilhos baseados na etapa</p>
            </div>
          </div>

          {/* Etapa de destino */}
          <div className="space-y-3 bg-indigo-50 p-6 rounded-xl border-2 border-indigo-200 shadow-sm">
            <Label htmlFor="targetStage" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Para qual etapa mover o lead?
            </Label>
            <Select value={targetStage} onValueChange={setTargetStage}>
              <SelectTrigger className="bg-white text-base">
                <SelectValue placeholder="Selecione a etapa de destino" />
              </SelectTrigger>
              <SelectContent>
                {commonStages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">✏️ Etapa personalizada</SelectItem>
              </SelectContent>
            </Select>

            {targetStage === 'custom' && (
              <div className="mt-3">
                <Input
                  placeholder="Nome da etapa personalizada"
                  className="text-sm"
                  onChange={(e) => setTargetStage(e.target.value === '' ? 'custom' : e.target.value)}
                />
                <p className="text-xs text-indigo-600 mt-2">
                  Digite o nome exato da etapa conforme está no seu funil
                </p>
              </div>
            )}

            <div className="bg-indigo-100 p-3 rounded-lg mt-3">
              <p className="text-sm text-indigo-800 font-medium">
                💡 Dica sobre etapas
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                Use as etapas padrão do seu CRM ou crie etapas personalizadas que fazem sentido para seu processo
              </p>
            </div>
          </div>

          {/* Notificar usuário */}
          <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-800">
                  📢 Notificar o lead sobre a mudança?
                </Label>
                <p className="text-sm text-gray-600">
                  Enviar mensagem informando sobre o progresso
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {notifyUser && (
              <p className="text-xs text-purple-600 mt-3 bg-white p-3 rounded-lg">
                ✅ O lead receberá uma mensagem automática sobre seu progresso no processo
              </p>
            )}
          </div>

          {/* Visual do funil */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-xl border-2 border-gray-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">📊</span>
              Funil de Vendas (exemplo)
            </Label>
            <div className="space-y-2">
              {commonStages.map((stage, idx) => (
                <div
                  key={stage.value}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    targetStage === stage.value
                      ? 'bg-indigo-100 border-2 border-indigo-400 shadow-md'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <span className="text-lg">{idx + 1}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      targetStage === stage.value ? 'text-indigo-700' : 'text-gray-700'
                    }`}>
                      {stage.label}
                    </p>
                  </div>
                  {targetStage === stage.value && (
                    <span className="text-indigo-600 font-bold">← Destino</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Exemplo prático */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Exemplo de uso
            </Label>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Cenário:</p>
                <p className="text-xs text-gray-600">
                  Lead demonstrou interesse e passou na qualificação
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Ação:</p>
                <p className="text-xs text-gray-600">
                  Mover de "Lead" para "Qualificado"
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-semibold text-yellow-700 mb-1">Resultado:</p>
                <p className="text-xs text-gray-600">
                  Time de vendas recebe notificação para enviar proposta
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da ação */}
          {targetStage && targetStage !== 'custom' && (
            <div className="space-y-3 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-300">
              <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Resumo da movimentação
              </Label>
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center justify-center gap-4 text-center">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Etapa atual</p>
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700">Qualquer</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl text-indigo-600">→</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Nova etapa</p>
                    <div className="bg-indigo-100 px-4 py-2 rounded-lg border-2 border-indigo-400">
                      <p className="text-sm font-bold text-indigo-700">
                        {commonStages.find(s => s.value === targetStage)?.label || targetStage}
                      </p>
                    </div>
                  </div>
                </div>
                {notifyUser && (
                  <p className="text-xs text-center text-purple-600 mt-3 bg-purple-50 p-2 rounded">
                    📢 Lead será notificado sobre o progresso
                  </p>
                )}
              </div>
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
                  tipo: 'move_funnel',
                  descricao: description,
                  etapa_destino: targetStage,
                  notificar_lead: notifyUser,
                  mensagem: [], // Sem mensagens por padrão
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
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Salvar Movimentação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
