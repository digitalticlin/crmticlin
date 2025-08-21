import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BroadcastService, BroadcastTarget } from '@/services/broadcast/broadcastService';
import { Funnel } from '@/types';
import { KanbanStage } from '@/types';
import { Tag } from '@/types';
import { LeadsPreview } from '@/components/broadcast/LeadsPreview';
import { toast } from 'sonner';
import { useBroadcastCampaigns } from '@/hooks/broadcast/useBroadcastCampaigns';

interface NewBroadcastListFormProps {
  onSuccess?: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  message_text: z.string().min(10, {
    message: "A mensagem deve ter pelo menos 10 caracteres.",
  }),
  media_type: z.enum(['text', 'image', 'video', 'audio']).default('text'),
  media_url: z.string().optional(),
  target: z.object({
    type: z.enum(['all', 'funnel', 'stage', 'tags', 'custom']),
    config: z.object({
      funnel_id: z.string().optional(),
      stage_id: z.string().optional(),
      tag_ids: z.array(z.string()).optional(),
      phone_numbers: z.array(z.string()).optional(),
    })
  }),
  schedule_type: z.enum(['immediate', 'scheduled']).default('immediate'),
  scheduled_at: z.string().optional(),
  rate_limit_per_minute: z.number().min(1).max(100).default(2),
  business_hours_only: z.boolean().default(false),
})

type CreateCampaignData = z.infer<typeof formSchema>;

export const NewBroadcastListForm: React.FC<NewBroadcastListFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [leadsPreview, setLeadsPreview] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const { createCampaign } = useBroadcastCampaigns();

  const form = useForm<CreateCampaignData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      message_text: "",
      media_type: 'text',
      target: {
        type: 'all',
        config: {}
      },
      schedule_type: 'immediate',
      rate_limit_per_minute: 2,
      business_hours_only: false,
    },
    mode: "onChange"
  })

  const { watch, setValue } = form;
  const formData = watch();

  useEffect(() => {
    const loadFunnels = async () => {
      try {
        const data = await BroadcastService.getFunnels();
        setFunnels(data);
      } catch (error) {
        console.error('Error fetching funnels:', error);
        toast.error('Erro ao carregar funis');
      }
    };

    const loadTags = async () => {
      try {
        const data = await BroadcastService.getTags();
        setTags(data);
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast.error('Erro ao carregar tags');
      }
    };

    loadFunnels();
    loadTags();
  }, []);

  useEffect(() => {
    const loadStages = async () => {
      if (formData.target.type === 'funnel' && formData.target.config.funnel_id) {
        try {
          const data = await BroadcastService.getStagesByFunnel(formData.target.config.funnel_id);
          setStages(data);
        } catch (error) {
          console.error('Error fetching stages:', error);
          toast.error('Erro ao carregar etapas do funil');
        }
      } else {
        setStages([]);
      }
    };

    loadStages();
  }, [formData.target.type, formData.target.config.funnel_id]);

  useEffect(() => {
    const loadLeadsPreview = async () => {
      try {
        const { leads, totalCount } = await BroadcastService.getLeadsPreview(formData.target);
        setLeadsPreview(leads);
        setTotalLeads(totalCount);
      } catch (error) {
        console.error('Error fetching leads preview:', error);
        toast.error('Erro ao carregar preview de leads');
        setLeadsPreview([]);
        setTotalLeads(0);
      }
    };

    loadLeadsPreview();
  }, [formData.target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Fix: Convert CreateCampaignData to BroadcastCampaign format
      const campaignData = {
        name: formData.name,
        message_text: formData.message_text,
        media_type: formData.media_type || 'text',
        media_url: formData.media_url,
        target_type: formData.target.type,
        target_config: formData.target.config,
        schedule_type: formData.schedule_type || 'immediate',
        scheduled_at: formData.scheduled_at,
        rate_limit_per_minute: formData.rate_limit_per_minute || 2,
        business_hours_only: formData.business_hours_only || false,
        status: 'draft' as const,
        timezone: 'America/Sao_Paulo'
      };

      const result = await createCampaign(campaignData);
      if (result) {
        toast.success('Campanha criada com sucesso!');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Campanha</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Promoção de Natal" {...field} />
              </FormControl>
              <FormDescription>
                Dê um nome para sua campanha para fácil identificação.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escreva sua mensagem aqui..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Escreva a mensagem que será enviada para os leads.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="media_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Mídia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de mídia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecione o tipo de mídia que você deseja enviar.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="media_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Mídia</FormLabel>
                <FormControl>
                  <Input placeholder="URL da sua mídia" {...field} />
                </FormControl>
                <FormDescription>
                  URL da imagem, vídeo ou áudio que será enviado.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="target.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Público-Alvo</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value);
                // Clear target config when target type changes
                setValue('target.config', {});
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o público-alvo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">Todos os Leads</SelectItem>
                  <SelectItem value="funnel">Funil Específico</SelectItem>
                  <SelectItem value="stage">Etapa do Funil</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                  <SelectItem value="custom">Lista Personalizada</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Selecione o público-alvo que receberá a mensagem.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {formData.target.type === 'funnel' && (
          <FormField
            control={form.control}
            name="target.config.funnel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Funil</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>{funnel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecione o funil que será usado como público-alvo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {formData.target.type === 'stage' && (
          <>
            <FormField
              control={form.control}
              name="target.config.funnel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funil</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Clear stage_id when funnel changes
                    setValue('target.config.stage_id', undefined);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {funnels.map((funnel) => (
                        <SelectItem key={funnel.id} value={funnel.id}>{funnel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o funil que contém a etapa desejada.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target.config.stage_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa do Funil</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione a etapa do funil que será usada como público-alvo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {formData.target.type === 'tags' && (
          <FormField
            control={form.control}
            name="target.config.tag_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <Select
                  multiple
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione as tags" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecione as tags que serão usadas como público-alvo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {formData.target.type === 'custom' && (
          <FormField
            control={form.control}
            name="target.config.phone_numbers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lista de Telefones</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="554199999999, 554188888888..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Insira uma lista de números de telefone separados por vírgula.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="schedule_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agendamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de agendamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="immediate">Imediato</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Selecione o tipo de agendamento para a campanha.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {formData.schedule_type === 'scheduled' && (
          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data e Hora</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP p")
                        ) : (
                          <span>Selecione a data e hora</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker
                      mode="single"
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="Pp"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        field.onChange(date?.toISOString());
                      }}
                      onChange={(date) => {
                        field.onChange(date?.toISOString());
                      }}
                      disabledDate={(date) => date < new Date()}
                      numberOfMonths={1}
                      from="new_broadcast_list_form"
                      className="border-none shadow-md"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Selecione a data e hora para agendar a campanha.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rate_limit_per_minute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de Mensagens por Minuto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 2"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Defina o número máximo de mensagens enviadas por minuto.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_hours_only"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Enviar Apenas em Horário Comercial</FormLabel>
                  <FormDescription>
                    Envie mensagens apenas entre 8h e 18h.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold">Preview de Destinatários</h3>
          <LeadsPreview leads={leadsPreview} total={totalLeads} />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Criando..." : "Criar Campanha"}
        </Button>
      </form>
    </Form>
  )
}
