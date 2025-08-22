import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/auth/useUser';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CampaignData {
  name: string;
  message: {
    text: string;
    mediaUrl: string;
    mediaType: string;
  };
  targetType: 'all' | 'tags' | 'contacts';
  targetConfig: {
    tags?: string[];
    contacts?: string[];
  };
  whatsappInstanceId: string;
  scheduleConfig: {
    type: 'immediate' | 'scheduled';
    businessHours: boolean;
    startHour: number;
    endHour: number;
    weekDays: string[];
    rateLimit: number;
  };
  targets: string[];
}

export const ModernCampaignCreator = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    message: {
      text: '',
      mediaUrl: '',
      mediaType: 'text',
    },
    targetType: 'all',
    targetConfig: {},
    whatsappInstanceId: '',
    scheduleConfig: {
      type: 'immediate',
      businessHours: false,
      startHour: 9,
      endHour: 18,
      weekDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      rateLimit: 10,
    },
    targets: [],
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [instances, setInstances] = useState<{ id: string; name: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsData, instancesData] = await Promise.all([
          supabase.from('contacts').select('id, name, phone'),
          supabase.from('whatsapp_instances').select('id, name')
        ]);

        if (contactsData.data) {
          setContacts(contactsData.data);
        }

        if (instancesData.data) {
          setInstances(instancesData.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('message.')) {
      const messageField = name.split('.')[1];
      setCampaignData(prev => ({
        ...prev,
        message: {
          ...prev.message,
          [messageField]: value,
        },
      }));
    } else {
      setCampaignData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTargetTypeChange = (value: CampaignData['targetType']) => {
    setCampaignData(prev => ({
      ...prev,
      targetType: value,
      targets: [],
    }));
  };

  const handleInstanceChange = (value: string) => {
    setCampaignData(prev => ({ ...prev, whatsappInstanceId: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCampaignData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        [name]: checked,
      },
    }));
  };

  const handleSliderChange = (value: number[]) => {
    setCampaignData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        startHour: value[0],
        endHour: value[1],
      },
    }));
  };

  const handleWeekDayChange = (day: string) => {
    setCampaignData(prev => {
      const weekDays = [...prev.scheduleConfig.weekDays];
      if (weekDays.includes(day)) {
        return {
          ...prev,
          scheduleConfig: {
            ...prev.scheduleConfig,
            weekDays: weekDays.filter(d => d !== day),
          },
        };
      } else {
        return {
          ...prev,
          scheduleConfig: {
            ...prev.scheduleConfig,
            weekDays: [...weekDays, day],
          },
        };
      }
    });
  };

  const handleRateLimitChange = (value: number[]) => {
    setCampaignData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        rateLimit: value[0],
      },
    }));
  };

  const handleContactSelect = (contactId: string) => {
    setCampaignData(prev => {
      const targets = [...prev.targets];
      if (targets.includes(contactId)) {
        return {
          ...prev,
          targets: targets.filter(id => id !== contactId),
        };
      } else {
        return {
          ...prev,
          targets: [...targets, contactId],
        };
      }
    });
  };

  const handleSendCampaign = async () => {
    if (!campaignData.message.text.trim()) {
      toast.error('Digite uma mensagem para enviar');
      return;
    }

    if (campaignData.targets.length === 0) {
      toast.error('Selecione pelo menos um contato');
      return;
    }

    setIsSending(true);
    
    try {
      const campaignPayload = {
        name: campaignData.name,
        message_text: campaignData.message.text,
        message_media_url: campaignData.message.mediaUrl,
        message_media_type: campaignData.message.mediaType as "text", // Corrigido: forçar tipo text
        target_type: campaignData.targetType,
        target_config: campaignData.targetConfig,
        whatsapp_instance_id: campaignData.whatsappInstanceId,
        schedule_config: {
          type: "immediate" as const, // Corrigido: forçar tipo immediate
          businessHours: campaignData.scheduleConfig.businessHours,
          startHour: campaignData.scheduleConfig.startHour,
          endHour: campaignData.scheduleConfig.endHour,
          weekDays: campaignData.scheduleConfig.weekDays,
          rateLimit: campaignData.scheduleConfig.rateLimit
        },
        status: 'draft' as const,
        created_by_user_id: user?.id || '',
        targets: campaignData.targets
      };

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([campaignPayload]);

      if (error) {
        console.error('Erro ao criar campanha:', error);
        toast.error('Erro ao criar campanha');
      } else {
        toast.success('Campanha criada com sucesso!');
        navigate('/automations');
      }
    } catch (error) {
      console.error('Erro ao enviar campanha:', error);
      toast.error('Erro ao enviar campanha');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Campanha de Marketing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna de Informações da Campanha */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={campaignData.name}
              onChange={handleInputChange}
              placeholder="Ex: Promoção de Verão"
            />
          </div>

          <div>
            <Label htmlFor="message.text">Mensagem</Label>
            <Textarea
              id="message.text"
              name="message.text"
              value={campaignData.message.text}
              onChange={handleInputChange}
              placeholder="Digite sua mensagem aqui..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="whatsappInstanceId">Instância do WhatsApp</Label>
            <Select value={campaignData.whatsappInstanceId} onValueChange={handleInstanceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {instances.map(instance => (
                  <SelectItem key={instance.id} value={instance.id}>{instance.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coluna de Configuração de Alvo e Agendamento */}
        <div className="space-y-4">
          <div>
            <Label>Tipo de Alvo</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={campaignData.targetType === 'all' ? 'default' : 'outline'}
                onClick={() => handleTargetTypeChange('all')}
              >
                Todos os Contatos
              </Button>
              <Button
                variant={campaignData.targetType === 'contacts' ? 'default' : 'outline'}
                onClick={() => handleTargetTypeChange('contacts')}
              >
                Selecionar Contatos
              </Button>
            </div>
          </div>

          {campaignData.targetType === 'contacts' && (
            <div className="border rounded-md p-2">
              <Label>Selecionar Contatos</Label>
              <div className="max-h-40 overflow-y-auto">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={campaignData.targets.includes(contact.id)}
                      onCheckedChange={() => handleContactSelect(contact.id)}
                    />
                    <Label htmlFor={`contact-${contact.id}`}>{contact.name} ({contact.phone})</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Agendamento</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="businessHours"
                name="businessHours"
                checked={campaignData.scheduleConfig.businessHours}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="businessHours">Apenas Horário Comercial</Label>
            </div>
          </div>

          {campaignData.scheduleConfig.businessHours && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label>Horário:</Label>
                <span>{campaignData.scheduleConfig.startHour}:00 - {campaignData.scheduleConfig.endHour}:00</span>
              </div>
              <Slider
                defaultValue={[campaignData.scheduleConfig.startHour, campaignData.scheduleConfig.endHour]}
                min={0}
                max={24}
                step={1}
                onValueChange={handleSliderChange}
              />

              <Separator className="my-2" />

              <Label>Dias da Semana:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <Button
                    key={day}
                    variant={campaignData.scheduleConfig.weekDays.includes(day) ? 'default' : 'outline'}
                    onClick={() => handleWeekDayChange(day)}
                    size="sm"
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Button>
                ))}
              </div>

              <Separator className="my-2" />

              <Label>Limite de Envio (mensagens por minuto): {campaignData.scheduleConfig.rateLimit}</Label>
              <Slider
                defaultValue={[campaignData.scheduleConfig.rateLimit]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => handleRateLimitChange(value)}
              />
            </div>
          )}

          <div>
            <Label>Data de Envio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", {locale: ptBR}) : (
                    <span>Escolher Data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button
          variant="primary"
          onClick={handleSendCampaign}
          disabled={isSending}
        >
          {isSending ? 'Enviando...' : 'Criar Campanha'}
        </Button>
      </div>
    </div>
  );
};
