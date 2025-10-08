import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, Edit3, Check, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Funnel, KanbanStage } from '@/types/funnel';
import type { MessageText } from '@/types/flowBuilder';

interface TransferToHumanEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    funnelId?: string;
    kanbanStageId?: string;
    messages?: MessageText[];
    notifyEnabled?: boolean;
    notifyPhone?: string;
    notifyGroupId?: string;
  };
  onSave: (data: {
    label: string;
    description: string;
    funnelId: string;
    kanbanStageId: string;
    messages: MessageText[];
    notifyEnabled: boolean;
    notifyPhone?: string;
    notifyGroupId?: string;
  }) => void;
}

export function TransferToHumanEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: TransferToHumanEditorProps) {
  const { user } = useAuth();
  const [label, setLabel] = useState(initialData?.label || 'Transferir para Humano');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [funnelId, setFunnelId] = useState(initialData?.funnelId || '');
  const [kanbanStageId, setKanbanStageId] = useState(initialData?.kanbanStageId || '');
  const [message, setMessage] = useState(
    initialData?.messages?.[0]?.type === 'text' ? initialData.messages[0].content : ''
  );

  // Estados de notificação
  const [notifyEnabled, setNotifyEnabled] = useState(initialData?.notifyEnabled || false);
  const [notifyInput, setNotifyInput] = useState(initialData?.notifyPhone || initialData?.notifyGroupId || '');
  const [notifyType, setNotifyType] = useState<'phone' | 'group'>('phone');

  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [isLoadingFunnels, setIsLoadingFunnels] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);

  // Detectar tipo de entrada (telefone ou link de grupo)
  useEffect(() => {
    if (notifyInput.includes('chat.whatsapp.com')) {
      setNotifyType('group');
    } else if (notifyInput.match(/^\d{12,15}$/)) {
      setNotifyType('phone');
    }
  }, [notifyInput]);

  // Carregar funis do usuário
  useEffect(() => {
    const loadFunnels = async () => {
      if (!user?.id) return;

      setIsLoadingFunnels(true);
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select('*')
          .eq('created_by_user_id', user.id)
          .order('name');

        if (error) throw error;
        setFunnels(data || []);
      } catch (error) {
        console.error('Erro ao carregar funis:', error);
      } finally {
        setIsLoadingFunnels(false);
      }
    };

    if (isOpen) {
      loadFunnels();
    }
  }, [isOpen, user?.id]);

  // Carregar stages quando um funil é selecionado
  useEffect(() => {
    const loadStages = async () => {
      if (!funnelId) {
        setStages([]);
        return;
      }

      setIsLoadingStages(true);
      try {
        const { data, error } = await supabase
          .from('kanban_stages')
          .select('*')
          .eq('funnel_id', funnelId)
          .order('order_position');

        if (error) throw error;
        setStages(data || []);
      } catch (error) {
        console.error('Erro ao carregar stages:', error);
      } finally {
        setIsLoadingStages(false);
      }
    };

    loadStages();
  }, [funnelId]);

  // Extrair ID do grupo do link do WhatsApp
  const extractGroupId = (input: string): string | null => {
    // Formato: https://chat.whatsapp.com/ABC123XYZ
    const match = input.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return `${match[1]}@g.us`;
    }
    return null;
  };

  const handleSave = () => {
    setIsEditingLabel(false);

    const messages: MessageText[] = message.trim()
      ? [{ type: 'text', content: message, delay: 0 }]
      : [];

    let notifyPhone: string | undefined;
    let notifyGroupId: string | undefined;

    if (notifyEnabled && notifyInput.trim()) {
      if (notifyType === 'group') {
        // Extrair ID do grupo
        notifyGroupId = extractGroupId(notifyInput) || undefined;
      } else {
        // Validar formato de telefone (556299999999)
        const cleanPhone = notifyInput.replace(/\D/g, '');
        if (cleanPhone.match(/^55\d{10,11}$/)) {
          notifyPhone = cleanPhone;
        }
      }
    }

    onSave({
      label,
      description,
      funnelId,
      kanbanStageId,
      messages,
      notifyEnabled,
      notifyPhone,
      notifyGroupId
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30">
                <Bell className="h-6 w-6 text-white" />
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
              Transferir lead e notificar equipe no WhatsApp
            </p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                O que deve acontecer nesta etapa?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Transferir para atendente humano e notificar equipe comercial"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Mensagem para o lead (OBRIGATÓRIA) */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Mensagem para o lead <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Vou transferir você para um especialista da nossa equipe. Aguarde só um momento! 🙋‍♂️"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Esta mensagem será enviada ao lead antes da transferência
              </p>
            </div>

            {/* Seletor de Funil */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Mover para o funil
              </Label>
              <Select
                value={funnelId}
                onValueChange={(value) => {
                  setFunnelId(value);
                  setKanbanStageId('');
                }}
                disabled={isLoadingFunnels}
              >
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue placeholder={
                    isLoadingFunnels ? 'Carregando funis...' : 'Escolha um funil'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFunnels ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : funnels.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum funil disponível
                    </SelectItem>
                  ) : (
                    funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        🎯 {funnel.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Etapa */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Mover para a etapa
              </Label>
              <Select
                value={kanbanStageId}
                onValueChange={setKanbanStageId}
                disabled={!funnelId || isLoadingStages}
              >
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue placeholder={
                    !funnelId ? 'Primeiro selecione um funil' :
                    isLoadingStages ? 'Carregando etapas...' :
                    'Escolha uma etapa'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStages ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : stages.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma etapa disponível
                    </SelectItem>
                  ) : (
                    stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          {stage.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                          )}
                          <span>{stage.title}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                A equipe será notificada que há um lead aguardando nesta etapa
              </p>
            </div>

            {/* Toggle de Notificação */}
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium text-gray-700">
                    Notificar equipe no WhatsApp
                  </Label>
                </div>
                <Switch
                  checked={notifyEnabled}
                  onCheckedChange={setNotifyEnabled}
                />
              </div>

              {notifyEnabled && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="notifyInput" className="text-sm font-medium text-gray-700">
                    Telefone ou Link do Grupo
                  </Label>
                  <Input
                    id="notifyInput"
                    value={notifyInput}
                    onChange={(e) => setNotifyInput(e.target.value)}
                    placeholder="556299999999 ou https://chat.whatsapp.com/ABC123"
                    className="bg-white/50 border-blue-200/50 focus:bg-white"
                  />
                  <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/50 p-3 rounded-lg">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p><strong>Telefone:</strong> formato 556299999999 (com DDI 55)</p>
                      <p><strong>Grupo:</strong> cole o link completo do grupo WhatsApp</p>
                      <p className="text-blue-600 font-medium">
                        {notifyType === 'group'
                          ? '📱 Detectado: Link de Grupo'
                          : '📱 Detectado: Telefone Individual'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!funnelId || !kanbanStageId || !message.trim()}
                className="px-6 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-sm font-medium shadow-lg shadow-blue-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
