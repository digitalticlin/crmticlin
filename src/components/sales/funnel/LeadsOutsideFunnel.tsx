
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface LeadOutsideFunnel {
  id: string;
  name: string;
  phone: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface LeadsOutsideFunnelProps {
  selectedFunnelId?: string;
  onLeadAdded?: () => void;
}

export const LeadsOutsideFunnel = ({ selectedFunnelId, onLeadAdded }: LeadsOutsideFunnelProps) => {
  const [leadsOutside, setLeadsOutside] = useState<LeadOutsideFunnel[]>([]);
  const [loading, setLoading] = useState(false);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadLeadsOutsideFunnel();
    }
  }, [companyId, selectedFunnelId]);

  const loadLeadsOutsideFunnel = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, last_message, last_message_time, unread_count')
        .eq('company_id', companyId)
        .is('kanban_stage_id', null)
        .order('last_message_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeadsOutside(data || []);
    } catch (error) {
      console.error('Erro ao carregar leads fora do funil:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const addLeadToFunnel = async (leadId: string) => {
    if (!selectedFunnelId) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    try {
      // Buscar o estágio "ENTRADA DE LEAD"
      const { data: entryStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('funnel_id', selectedFunnelId)
        .eq('title', 'ENTRADA DE LEAD')
        .single();

      if (!entryStage) {
        toast.error("Estágio de entrada não encontrado");
        return;
      }

      // Atualizar o lead
      const { error } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: entryStage.id,
          funnel_id: selectedFunnelId
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success("Lead adicionado ao funil!");
      loadLeadsOutsideFunnel();
      onLeadAdded?.();
    } catch (error) {
      console.error("Erro ao adicionar lead ao funil:", error);
      toast.error("Erro ao adicionar lead ao funil");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Leads do Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Carregando leads...</p>
        </CardContent>
      </Card>
    );
  }

  if (leadsOutside.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Leads do Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Todos os leads já estão organizados no funil!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Leads do Chat ({leadsOutside.length})
        </CardTitle>
        <p className="text-sm text-gray-600">
          Leads que ainda não foram organizados no funil de vendas
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leadsOutside.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{lead.name || "Lead sem nome"}</h4>
                  {lead.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {lead.unread_count} não lidas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </div>
                {lead.last_message && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {lead.last_message}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => addLeadToFunnel(lead.id)}
                disabled={!selectedFunnelId}
                className="ml-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
