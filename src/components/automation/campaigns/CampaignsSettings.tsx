
import { useState } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Globe, Bell, Database, Shield } from "lucide-react";
import { toast } from "sonner";

export const CampaignsSettings = () => {
  const [settings, setSettings] = useState({
    defaultRateLimit: 2,
    defaultBusinessHours: true,
    defaultStartTime: '08:00',
    defaultEndTime: '18:00',
    enableNotifications: true,
    notificationEmail: '',
    autoRetryFailed: true,
    maxRetries: 3,
    defaultTimezone: 'America/Sao_Paulo',
    globalSignature: '',
  });

  const handleSave = () => {
    // Here you would save to backend
    toast.success("Configurações salvas com sucesso!");
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Default Campaign Settings */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Padrão de Campanhas
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Limite Padrão de Mensagens/Minuto</Label>
              <Select 
                value={String(settings.defaultRateLimit)} 
                onValueChange={(value) => updateSetting('defaultRateLimit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mensagem/minuto</SelectItem>
                  <SelectItem value="2">2 mensagens/minuto</SelectItem>
                  <SelectItem value="3">3 mensagens/minuto</SelectItem>
                  <SelectItem value="4">4 mensagens/minuto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fuso Horário Padrão</Label>
              <Select 
                value={settings.defaultTimezone} 
                onValueChange={(value) => updateSetting('defaultTimezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Horário Comercial por Padrão</Label>
              <p className="text-sm text-muted-foreground">
                Novas campanhas respeitarão horário comercial automaticamente
              </p>
            </div>
            <Switch
              checked={settings.defaultBusinessHours}
              onCheckedChange={(checked) => updateSetting('defaultBusinessHours', checked)}
            />
          </div>

          {settings.defaultBusinessHours && (
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
              <div className="space-y-2">
                <Label>Hora de Início Padrão</Label>
                <Input
                  type="time"
                  value={settings.defaultStartTime}
                  onChange={(e) => updateSetting('defaultStartTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de Término Padrão</Label>
                <Input
                  type="time"
                  value={settings.defaultEndTime}
                  onChange={(e) => updateSetting('defaultEndTime', e.target.value)}
                />
              </div>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Notification Settings */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificações
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações sobre status das campanhas
              </p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
            />
          </div>

          {settings.enableNotifications && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Email para Notificações</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={settings.notificationEmail}
                onChange={(e) => updateSetting('notificationEmail', e.target.value)}
              />
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Retry Settings */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Retry
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Retry Automático para Falhas</Label>
              <p className="text-sm text-muted-foreground">
                Tentar reenviar mensagens que falharam automaticamente
              </p>
            </div>
            <Switch
              checked={settings.autoRetryFailed}
              onCheckedChange={(checked) => updateSetting('autoRetryFailed', checked)}
            />
          </div>

          {settings.autoRetryFailed && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Máximo de Tentativas</Label>
              <Select 
                value={String(settings.maxRetries)} 
                onValueChange={(value) => updateSetting('maxRetries', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="2">2 tentativas</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Global Signature */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Assinatura Global
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Assinatura Padrão (Opcional)</Label>
            <Textarea
              placeholder="Texto que será adicionado ao final de todas as mensagens..."
              value={settings.globalSignature}
              onChange={(e) => updateSetting('globalSignature', e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Esta assinatura será automaticamente adicionada ao final de todas as mensagens de campanha
            </p>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Database className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};
