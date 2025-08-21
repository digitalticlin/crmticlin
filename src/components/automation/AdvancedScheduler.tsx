
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Settings } from 'lucide-react';

export interface ScheduleConfig {
  type: 'immediate' | 'scheduled';
  scheduledDate?: string;
  scheduledTime?: string;
  businessHoursOnly: boolean;
  startHour: number;
  endHour: number;
  weekDays: number[];
  rateLimit: number;
}

interface AdvancedSchedulerProps {
  config: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
}

const WEEKDAYS = [
  { value: 0, label: 'Dom', shortLabel: 'D' },
  { value: 1, label: 'Seg', shortLabel: 'S' },
  { value: 2, label: 'Ter', shortLabel: 'T' },
  { value: 3, label: 'Qua', shortLabel: 'Q' },
  { value: 4, label: 'Qui', shortLabel: 'Q' },
  { value: 5, label: 'Sex', shortLabel: 'S' },
  { value: 6, label: 'Sáb', shortLabel: 'S' }
];

export const AdvancedScheduler: React.FC<AdvancedSchedulerProps> = ({
  config,
  onConfigChange
}) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Agendamento
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tipo de Disparo */}
        <div className="space-y-3">
          <Label>Quando enviar?</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={config.type === 'immediate' ? 'default' : 'outline'}
              onClick={() => updateConfig({ type: 'immediate' })}
              className="justify-start"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agora
            </Button>
            <Button
              variant={config.type === 'scheduled' ? 'default' : 'outline'}
              onClick={() => updateConfig({ type: 'scheduled' })}
              className="justify-start"
            >
              <Clock className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </div>
        </div>

        {/* Data e Hora Agendada */}
        {config.type === 'scheduled' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={config.scheduledDate || ''}
                onChange={(e) => updateConfig({ scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={config.scheduledTime || ''}
                onChange={(e) => updateConfig({ scheduledTime: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Horário Comercial */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Apenas horário comercial</Label>
              <p className="text-sm text-gray-500">
                Enviar apenas dentro do horário definido
              </p>
            </div>
            <Switch
              checked={config.businessHoursOnly}
              onCheckedChange={(checked) => updateConfig({ businessHoursOnly: checked })}
            />
          </div>

          {config.businessHoursOnly && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicial</Label>
                  <Select
                    value={config.startHour.toString()}
                    onValueChange={(value) => updateConfig({ startHour: parseInt(value) })}
                  >
                    <SelectTrigger>
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
                    <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <Button
                      key={day.value}
                      variant={config.weekDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleWeekDay(day.value)}
                      className="w-10 h-10 p-0"
                    >
                      {day.shortLabel}
                    </Button>
                  ))}
                </div>
              </div>

              <Badge variant="secondary" className="w-fit">
                {formatTimeRange()} • {config.weekDays.length} dia(s)
              </Badge>
            </div>
          )}
        </div>

        {/* Limite de Taxa */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Mensagens por minuto
          </Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="10"
              value={config.rateLimit}
              onChange={(e) => updateConfig({ rateLimit: parseInt(e.target.value) || 2 })}
              className="w-20"
            />
            <span className="text-sm text-gray-500">
              Recomendado: 2-4 para evitar bloqueio
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
