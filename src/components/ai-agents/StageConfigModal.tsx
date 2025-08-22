import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, X, Target, Bell, BellOff, Phone, AlertCircle } from "lucide-react";

interface FunnelStage {
  id: string;
  title: string;
  color: string;
  order_position: number;
  ai_stage_description: string;
  ai_notify_enabled: boolean;
  notify_phone: string;
  funnel_id: string;
}

interface StageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: FunnelStage | null;
  onSave: (updatedStage: FunnelStage) => Promise<void>;
}

export const StageConfigModal = ({
  isOpen,
  onClose,
  stage,
  onSave
}: StageConfigModalProps) => {
  const [formData, setFormData] = useState({
    ai_stage_description: '',
    ai_notify_enabled: false,
    notify_phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados quando stage muda
  useEffect(() => {
    if (stage) {
      setFormData({
        ai_stage_description: stage.ai_stage_description || '',
        ai_notify_enabled: stage.ai_notify_enabled || false,
        notify_phone: stage.notify_phone || '',
      });
    }
  }, [stage]);

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata para +55 11 99999-9999
    if (numbers.length >= 11) {
      const formatted = numbers.substring(0, 13);
      return `+${formatted.substring(0, 2)} ${formatted.substring(2, 4)} ${formatted.substring(4, 9)}-${formatted.substring(9, 13)}`;
    } else if (numbers.length >= 2) {
      return `+${numbers}`;
    }
    
    return value;
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 11; // Mínimo: +55 11 99999999
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, notify_phone: formatted }));
  };

  const handleSave = async () => {
    if (!stage) return;

    // Validações
    if (!formData.ai_stage_description.trim()) {
      toast.error('Descrição obrigatória', {
        description: 'Por favor, descreva como a IA deve identificar este estágio.',
      });
      return;
    }

    if (formData.ai_notify_enabled && !validatePhone(formData.notify_phone)) {
      toast.error('Telefone inválido', {
        description: 'Digite um telefone válido no formato +55 11 99999-9999',
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedStage: FunnelStage = {
        ...stage,
        ai_stage_description: formData.ai_stage_description.trim(),
        ai_notify_enabled: formData.ai_notify_enabled,
        notify_phone: formData.ai_notify_enabled ? formData.notify_phone : '',
      };

      await onSave(updatedStage);

      // Feedback visual no botão
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        const originalText = saveButton.textContent;
        saveButton.textContent = '✅ Salvo!';
        saveButton.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
          saveButton.textContent = originalText;
          saveButton.style.backgroundColor = '';
          onClose(); // Fecha o modal após feedback
        }, 1500);
      } else {
        onClose(); // Fallback se não encontrar o botão
      }

    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (stage) {
      // Reset para valores originais
      setFormData({
        ai_stage_description: stage.ai_stage_description || '',
        ai_notify_enabled: stage.ai_notify_enabled || false,
        notify_phone: stage.notify_phone || '',
      });
    }
    onClose();
  };

  if (!stage) return null;

  const getStageEmoji = (position: number) => {
    const emojis = ['🎯', '👀', '📋', '💬', '🤝', '✅', '🏆', '🎉'];
    return emojis[position - 1] || '📌';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
        <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: stage.color || '#e0e0e0' }}
            >
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {getStageEmoji(stage.order_position)} {stage.title}
                <Badge variant="outline" className="bg-white/40">
                  Posição {stage.order_position}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-normal mt-1">
                Configure como a IA deve identificar e notificar este estágio
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4 max-h-[calc(90vh-200px)]">
          
          {/* Descrição para IA */}
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                📝 Critérios para IA
              </CardTitle>
              <p className="text-sm text-gray-600">
                Descreva quando um lead está neste estágio para que a IA possa analisar conversas
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.ai_stage_description}
                onChange={(e) => setFormData(prev => ({ ...prev, ai_stage_description: e.target.value }))}
                placeholder={`Ex: Lead demonstrou interesse no produto, fez perguntas específicas, solicitou demonstração ou pediu mais informações sobre preços e condições.`}
                className="min-h-32 bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg resize-none"
                rows={6}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Seja específico para que a IA identifique corretamente
                </p>
                <span className="text-xs text-gray-400">
                  {formData.ai_stage_description.length}/500
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Notificação */}
          <Card className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                🔔 Notificações WhatsApp
              </CardTitle>
              <p className="text-sm text-gray-600">
                Receba uma mensagem quando um lead for movido para este estágio
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Toggle Notificação */}
              <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.ai_notify_enabled ? (
                    <Bell className="h-5 w-5 text-green-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      Notificar quando lead entrar neste estágio
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.ai_notify_enabled ? 'Você receberá WhatsApp' : 'Nenhuma notificação será enviada'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, ai_notify_enabled: !prev.ai_notify_enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                    formData.ai_notify_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.ai_notify_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Campo Telefone - só aparece se notificação ativa */}
              {formData.ai_notify_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="notify_phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Telefone para receber notificações
                  </Label>
                  <Input
                    id="notify_phone"
                    value={formData.notify_phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-lg"
                  />
                  {formData.notify_phone && !validatePhone(formData.notify_phone) && (
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      Digite um telefone válido (mínimo 11 dígitos)
                    </div>
                  )}
                  
                  {/* Preview da notificação */}
                  {formData.ai_notify_enabled && validatePhone(formData.notify_phone) && (
                    <div className="mt-3 p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium mb-1">📱 Preview da notificação:</p>
                      <p className="text-sm text-blue-800 bg-white/60 p-2 rounded border">
                        🚀 Lead movido para: <strong>{stage.title}</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          (A IA gerará uma mensagem personalizada com detalhes do lead)
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer com botões */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 h-11 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !formData.ai_stage_description.trim()}
            data-save-button
            className="px-8 h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};