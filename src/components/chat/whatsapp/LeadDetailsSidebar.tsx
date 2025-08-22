import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";
import { TiclinAvatar } from "@/components/ui/ticlin-avatar";
import { ClientData } from "@/hooks/clients/types";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@/contexts/AuthContext';
import { useWhatsAppContext } from '@/contexts/WhatsAppContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LeadDetailsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: ClientData | null;
  onUpdateLead: (lead: ClientData) => Promise<void>;
}

interface DealHistoryItem {
  id: string;
  type: 'win' | 'loss';
  value: number;
  date: string;
  stage: string;
  notes: string;
}

const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({ open, onOpenChange, lead, onUpdateLead }) => {
  const [dealValue, setDealValue] = useState<number>(lead?.purchase_value || 0);
  const [dealNotes, setDealNotes] = useState<string>(lead?.notes || '');
  const [dealStatus, setDealStatus] = useState<'open' | 'won' | 'lost'>('open');
  const [dealDate, setDealDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [dealHistory, setDealHistory] = useState<DealHistoryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { whatsAppNumber } = useWhatsAppContext();
  const supabaseClient = useSupabaseClient();
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (lead) {
      setDealValue(lead.purchase_value || 0);
      setDealNotes(lead.notes || '');
      // Simular carregamento do histórico do negócio
      const mockHistory: DealHistoryItem[] = [
        {
          id: crypto.randomUUID(),
          type: 'win',
          value: 500,
          date: new Date().toISOString(),
          stage: lead.stage_name || 'Contato Inicial',
          notes: 'Primeiro contato realizado com sucesso.'
        },
      ];
      setDealHistory(mockHistory);
    }
  }, [lead]);

  const handleSaveDeal = async () => {
    if (!lead) return;

    setSaving(true);
    try {
      const updatedLead: ClientData = {
        ...lead,
        purchase_value: dealValue,
        notes: dealNotes,
        updated_at: new Date().toISOString(),
      };

      await onUpdateLead(updatedLead);

      // Adicionar ao histórico do negócio
      const newDealItem: DealHistoryItem = {
        id: crypto.randomUUID(),
        type: dealStatus === "won" ? "win" : "loss", // Fix: use "win"/"loss" instead of "won"/"lost"
        value: dealValue,
        date: new Date().toISOString(),
        stage: lead.stage_name || "Unknown",
        notes: dealNotes || ""
      };
      setDealHistory(prevHistory => [...prevHistory, newDealItem]);

      toast({
        title: "Sucesso!",
        description: "Detalhes do lead atualizados com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao atualizar o lead.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!lead) {
    return (
      <Card className={cn(
        "fixed inset-y-0 right-0 w-96 bg-white border-l shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detalhes do Lead</CardTitle>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p>Nenhum lead selecionado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "fixed inset-y-0 right-0 w-96 bg-white border-l shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
      open ? "translate-x-0" : "translate-x-full"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Detalhes do Lead</CardTitle>
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <TiclinAvatar name={lead.name} />
          <div>
            <h4 className="text-lg font-semibold">{lead.name}</h4>
            <p className="text-sm text-muted-foreground">{lead.email || 'Sem email'}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="dealValue">Valor do Negócio</Label>
          <Input
            id="dealValue"
            type="number"
            value={dealValue}
            onChange={(e) => setDealValue(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealNotes">Anotações do Negócio</Label>
          <Textarea
            id="dealNotes"
            value={dealNotes}
            onChange={(e) => setDealNotes(e.target.value)}
            placeholder="Anotações sobre o lead"
          />
        </div>

        <div className="space-y-2">
          <Label>Status do Negócio</Label>
          <div className="flex gap-2">
            <Button
              variant={dealStatus === 'open' ? 'default' : 'outline'}
              onClick={() => setDealStatus('open')}
            >
              Em Aberto
            </Button>
            <Button
              variant={dealStatus === 'won' ? 'default' : 'outline'}
              onClick={() => setDealStatus('won')}
            >
              Ganho
            </Button>
            <Button
              variant={dealStatus === 'lost' ? 'default' : 'outline'}
              onClick={() => setDealStatus('lost')}
            >
              Perdido
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Data do Negócio</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Escolher uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleSaveDeal} disabled={saving}>
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              Salvando...
            </>
          ) : (
            "Salvar Detalhes"
          )}
        </Button>

        <Separator />

        <div>
          <h5 className="text-sm font-medium">Histórico do Negócio</h5>
          <ScrollArea className="h-[200px] space-y-2">
            {dealHistory.map((item) => (
              <div key={item.id} className="border rounded-md p-2">
                <p className="text-xs text-muted-foreground">
                  {item.type === 'win' ? 'Ganho' : 'Perdido'} - {format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm">Valor: R$ {item.value}</p>
                <p className="text-sm">Anotações: {item.notes}</p>
              </div>
            ))}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadDetailsSidebar;
