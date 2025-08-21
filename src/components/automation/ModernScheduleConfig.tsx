
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Settings, Zap } from "lucide-react";

interface ScheduleConfig {
  type: 'immediate' | 'scheduled';
  scheduledDate?: string;
  scheduledTime?: string;
  businessHours: boolean;
  startHour: number;
  endHour: number;
  weekDays: number[];
  rateLimit: number;
}

interface ModernScheduleConfigProps {
  config: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
}

const WEEKDAYS = [
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
  { value: 0, label: 'Dom', fullLabel: 'Domingo' }
];

export function ModernScheduleConfig({ config, onConfigChange }: ModernScheduleConfigProps) {
  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleWeekDay = (dayValue: number) => {
    const isSelected = config.weekDays.includes(dayValue);
    const newWeekDays = isSelected
      ? config.weekDays.filter(d => d !== dayValue)
      : [...config.weekDays, dayValue].sort();
    
    updateConfig({ weekDays: newWeekDays });
  };

  const formatTimeRange = () => {
    return `${config.startHour.toString().padStart(2, '0')}:00 - ${config.endHour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Agendamento */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Quando Enviar
          </ModernCardTitle>
        </ModernCardHeader>

        <ModernCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={config.type === 'immediate' ? 'default' : 'outline'}
              onClick={() => updateConfig({ type: 'immediate' })}
              className={`justify-start h-auto p-4 ${
                config.type === 'immediate' 
                  ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white border-0' 
                  : 'bg-white/20 border-white/20 hover:bg-white/30'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Imediato</span>
                </div>
                <span className="text-xs opacity-80 mt-1">
                  Iniciar agora
                </span>
              </div>
            </Button>

            <Button
              variant={config.type === 'scheduled' ? 'default' : 'outline'}
              onClick={() => updateConfig({ type: 'scheduled' })}
              className={`justify-start h-auto p-4 ${
                config.type === 'scheduled' 
                  ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white border-0' 
                  : 'bg-white/20 border-white/20 hover:bg-white/30'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Agendar</span>
                </div>
                <span className="text-xs opacity-80 mt-1">
                  Definir data/hora
                </span>
              </div>
            </Button>
          </div>

          {/* Data e Hora Agendada */}
          {config.type === 'scheduled' && (
            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={config.scheduledDate || ''}
                    onChange={(e) => updateConfig({ scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-white/70 border-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={config.scheduledTime || ''}
                    onChange={(e) => updateConfig({ scheduledTime: e.target.value })}
                    className="bg-white/70 border-white/30"
                  />
                </div>
              </div>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Horário Comercial */}
      <ModernCard>
        <ModernCardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Apenas horário comercial</Label>
              <p className="text-sm text-muted-foreground">
                Respeitar dias e horários específicos para envio
              </p>
            </div>
            <Switch
              checked={config.businessHours}
              onCheckedChange={(checked) => updateConfig({ businessHours: checked })}
            />
          </div>

          {config.businessHours && (
            <div className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-lg p-4 space-y-4">
              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicial</Label>
                  <Select
                    value={config.startHour.toString()}
                    onValueChange={(value) => updateConfig({ startHour: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white/70 border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hora final</Label>
                  <Select
                    value={config.endHour.toString()}
                    onValueChange={(value) => updateConfig({ endHour: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white/70 border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem 
                          key={i} 
                          value={i.toString()}
                          disabled={i <= config.startHour}
                        >
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="space-y-3">
                <Label>Dias da semana</Label>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day) => (
                    <Button
                      key={day.value}
                      variant={config.weekDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleWeekDay(day.value)}
                      className={`w-full h-12 text-xs ${
                        config.weekDays.includes(day.value)
                          ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          : 'bg-white/50 border-white/30 hover:bg-white/70'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{day.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Badge variant="secondary" className="w-fit bg-indigo-100 text-indigo-800">
                {formatTimeRange()} • {config.weekDays.length} dia(s)
              </Badge>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Limite de Taxa */}
      <ModernCard>
        <ModernCardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <Label className="text-base font-medium">Controle de Velocidade</Label>
          </div>
          
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-amber-800">
                Mensagens por minuto
              </span>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                {config.rateLimit}/min
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.rateLimit}
                onChange={(e) => updateConfig({ rateLimit: parseInt(e.target.value) })}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-amber-700">
                <span>Mais lento (1/min)</span>
                <span>Mais rápido (10/min)</span>
              </div>
              
              <p className="text-xs text-amber-700">
                💡 Recomendado: 2-4 mensagens por minuto para evitar bloqueio
              </p>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
}
