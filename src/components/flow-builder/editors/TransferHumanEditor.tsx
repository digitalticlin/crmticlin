import { useState, useEffect } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Edit3, Check, Loader2 } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Funnel, KanbanStage } from '@/types/funnel';

interface TransferHumanEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    phone?: string;
    notificationMessage?: string;
    moveEnabled?: boolean;
    funnelId?: string;
    kanbanStageId?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    moveEnabled?: boolean;
    funnelId?: string;
    kanbanStageId?: string;
    block_data?: {
      transfer_to_human: {
        notify_enabled: boolean;
        phone?: string;
        notification_message?: string;
      };
      field_updates?: Array<{
        fieldName: string;
        fieldValue: string;
      }>;
      funnel_name?: string;
      stage_name?: string;
    };
  }) => void;
}

export function TransferHumanEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: TransferHumanEditorProps) {
  const { user } = useAuth();
  const [label, setLabel] = useState(initialData?.label || 'Avisar Humano');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [message, setMessage] = useState(
    initialData?.messages[0]?.type === 'text' ? initialData.messages[0].content : ''
  );
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [notificationMessage, setNotificationMessage] = useState(initialData?.notificationMessage || '');

  // Estados para movimentação no funil
  const [moveEnabled, setMoveEnabled] = useState(initialData?.moveEnabled ?? false);
  const [funnelId, setFunnelId] = useState(initialData?.funnelId || '');
  const [kanbanStageId, setKanbanStageId] = useState(initialData?.kanbanStageId || '');
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [isLoadingFunnels, setIsLoadingFunnels] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);

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
        setKanbanStageId('');
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

  const handleSave = () => {
    setIsEditingLabel(false);

    const messages: MessageText[] = message.trim()
      ? [
          {
            type: 'text',
            content: message,
            delay: 0
          }
        ]
      : [];

    console.log('🔵 TransferHumanEditor - handleSave:', {
      message,
      messages,
      hasMessage: message.trim().length > 0
    });

    // Obter nomes para referência
    const selectedFunnel = funnels.find(f => f.id === funnelId);
    const selectedStage = stages.find(s => s.id === kanbanStageId);

    onSave({
      label,
      description,
      messages,
      moveEnabled,
      funnelId: moveEnabled ? funnelId : undefined,
      kanbanStageId: moveEnabled ? kanbanStageId : undefined,
      block_data: {
        transfer_to_human: {
          notify_enabled: true,
          phone: phone,
          notification_message: notificationMessage
        },
        ...(moveEnabled && funnelId && kanbanStageId ? {
          field_updates: [
            {
              fieldName: 'funnel_id',
              fieldValue: funnelId
            },
            {
              fieldName: 'kanban_stage_id',
              fieldValue: kanbanStageId
            }
          ],
          funnel_name: selectedFunnel?.name || '',
          stage_name: selectedStage?.title || ''
        } : {})
      }
    });

    onClose();
  };

  const isValid = () => {
    if (!message.trim()) return false;
    if (!phone.trim()) return false;
    if (!notificationMessage.trim()) return false;
    if (moveEnabled && (!funnelId || !kanbanStageId)) return false;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Configure quando avisar um atendente humano
          </DialogDescription>
        </VisuallyHidden>

        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg shadow-purple-600/30">
                <Phone className="h-6 w-6 text-white" />
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
              Avisar um atendente humano para continuar a conversa
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
                placeholder="Ex: Avisar atendente quando o lead solicitar falar com humano"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Mensagem ao Lead
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Vou te conectar com um atendente. Aguarde um momento..."
                rows={4}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Mensagem que será enviada ao lead antes da transferência
              </p>
            </div>

            {/* Dados de Notificação */}
            <div className="space-y-4 p-4 bg-white/20 rounded-xl border border-white/30">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Qual WhatsApp a IA vai notificar? *
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    className="bg-white/30 border-white/40 focus:bg-white/50"
                  />
                  <p className="text-xs text-gray-500">
                    Telefone no formato internacional (código do país + DDD + número)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationMessage" className="text-sm font-medium text-gray-700">
                    Mensagem de Notificação *
                  </Label>
                  <Textarea
                    id="notificationMessage"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Ex: Novo atendimento transferido. Lead: {{nome_do_lead}}"
                    rows={3}
                    className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setNotificationMessage(prev => prev + '{{nome_do_lead}}')}
                      className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
                    >
                      + Nome do Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationMessage(prev => prev + '{{numero_do_lead}}')}
                      className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
                    >
                      + Número do Lead
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use as variáveis acima para personalizar a mensagem de notificação
                  </p>
                </div>
              </div>
            </div>

            {/* Seção de Movimentação no Funil */}
            <div className="space-y-4 p-4 bg-white/20 rounded-xl border border-white/30">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="moveEnabled"
                  checked={moveEnabled}
                  onCheckedChange={(checked) => setMoveEnabled(checked as boolean)}
                />
                <Label
                  htmlFor="moveEnabled"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Deseja mover o lead no funil?
                </Label>
              </div>

              {moveEnabled && (
                <div className="space-y-4 pl-7 animate-in fade-in-50 duration-200">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Selecione o funil
                    </Label>
                    <Select
                      value={funnelId}
                      onValueChange={(value) => {
                        setFunnelId(value);
                        setKanbanStageId(''); // Reset stage quando muda o funil
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Selecione a etapa
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
                      O lead será movido automaticamente para esta etapa
                    </p>
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
                disabled={!isValid()}
                className="px-6 py-2.5 bg-gradient-to-br from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-full text-sm font-medium shadow-lg shadow-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
