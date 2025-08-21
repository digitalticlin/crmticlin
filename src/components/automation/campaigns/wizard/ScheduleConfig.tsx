
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Clock, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleConfigProps {
  data: any;
  onChange: (updates: any) => void;
  onValidChange: (valid: boolean) => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Segunda', short: 'Seg' },
  { id: 2, label: 'Terça', short: 'Ter' },
  { id: 3, label: 'Quarta', short: 'Qua' },
  { id: 4, label: 'Quinta', short: 'Qui' },
  { id: 5, label: 'Sexta', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' },
];

const RATE_LIMITS = [
  { value: 1, label: '1 mensagem por minuto' },
  { value: 2, label: '2 mensagens por minuto' },
  { value: 3, label: '3 mensagens por minuto' },
  { value: 4, label: '4 mensagens por minuto' },
];

export const ScheduleConfig = ({ data, onChange, onValidChange }: ScheduleConfigProps) => {
  const [isScheduled, setIsScheduled] = useState(data.schedule_type === 'scheduled');

  useEffect(() => {
    // Always valid for this step
    onValidChange(true);
  }, [onValidChange]);

  const handleScheduleToggle = (scheduled: boolean) => {
    setIsScheduled(scheduled);
    onChange({
      schedule_type: scheduled ? 'scheduled' : 'immediate',
      scheduled_at: scheduled ? data.scheduled_at : ''
    });
  };

  const handleScheduledDate = (scheduled_at: string) => {
    onChange({ scheduled_at });
  };

  const handleRateLimit = (rate_limit_per_minute: number) => {
    onChange({ rate_limit_per_minute });
  };

  const handleBusinessHours = (business_hours_only: boolean) => {
    onChange({ business_hours_only });
  };

  const handleTimeRange = (field: 'start' | 'end', value: string) => {
    const timeRange = { ...data.time_range };
    timeRange[field] = value;
    onChange({ time_range: timeRange });
  };

  const handleDayToggle = (dayId: number, checked: boolean) => {
    const currentDays = data.time_range?.days || [1, 2, 3, 4, 5, 6];
    const newDays = checked
      ? [...currentDays, dayId]
      : currentDays.filter((d: number) => d !== dayId);
    
    const timeRange = { ...data.time_range, days: newDays };
    onChange({ time_range: timeRange });
  };

  const selectedDays = data.time_range?.days || [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-6">
      {/* Schedule Type */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tipo de Envio
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Agendar Envio</Label>
              <p className="text-sm text-muted-foreground">
                Escolha quando iniciar a campanha
              </p>
            </div>
            <Switch
              checked={isScheduled}
              onCheckedChange={handleScheduleToggle}
            />
          </div>

          {isScheduled && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="scheduled-date">Data e Hora de Início</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={data.scheduled_at}
                onChange={(e) => handleScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Business Hours */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Respeitar Horário Comercial</Label>
              <p className="text-sm text-muted-foreground">
                Enviar apenas durante os horários configurados
              </p>
            </div>
            <Switch
              checked={data.business_hours_only}
              onCheckedChange={handleBusinessHours}
            />
          </div>

          {data.business_hours_only && (
            <div className="space-y-4 pt-4 border-t">
              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora de Início</Label>
                  <Input
                    type="time"
                    value={data.time_range?.start || '08:00'}
                    onChange={(e) => handleTimeRange('start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora de Término</Label>
                  <Input
                    type="time"
                    value={data.time_range?.end || '18:00'}
                    onChange={(e) => handleTimeRange('end', e.target.value)}
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div className="space-y-3">
                <Label>Dias da Semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.id}`}
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {day.short}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ 
                      time_range: { ...data.time_range, days: [1, 2, 3, 4, 5] }
                    })}
                  >
                    Dias Úteis
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ 
                      time_range: { ...data.time_range, days: [1, 2, 3, 4, 5, 6] }
                    })}
                  >
                    Seg a Sáb
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ 
                      time_range: { ...data.time_range, days: [0, 1, 2, 3, 4, 5, 6] }
                    })}
                  >
                    Todos os Dias
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Rate Limiting */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Envio
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Limite de Mensagens</Label>
            <Select 
              value={String(data.rate_limit_per_minute)} 
              onValueChange={(value) => handleRateLimit(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATE_LIMITS.map((rate) => (
                  <SelectItem key={rate.value} value={String(rate.value)}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Limite mais baixo reduz risco de bloqueio pelo WhatsApp
            </p>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
};
