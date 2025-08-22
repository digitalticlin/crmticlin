
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Tag,
  MessageCircle,
  Clock,
  TrendingUp,
  MapPin,
  Building,
  Edit3,
  X,
  Trash2
} from "lucide-react";
import { Contact } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadDetailsSidebarProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onLeadDetail: (contact: Contact) => void;
}

interface DealHistoryItem {
  id: string;
  value: number;
  note?: string;
  created_at: string;
  stage_name?: string;
}

interface LeadTag {
  id: string;
  name: string;
  color: string;
}

export const LeadDetailsSidebar = ({
  contact,
  isOpen,
  onClose,
  onLeadDetail
}: LeadDetailsSidebarProps) => {
  const { user } = useAuth();
  const [dealHistory, setDealHistory] = useState<DealHistoryItem[]>([]);
  const [leadTags, setLeadTags] = useState<LeadTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && contact.leadId) {
      fetchDealHistory();
      fetchLeadTags();
    }
  }, [isOpen, contact.leadId]);

  const fetchDealHistory = async () => {
    if (!contact.leadId || !user) return;

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          value,
          note,
          created_at,
          kanban_stages(name)
        `)
        .eq('lead_id', contact.leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHistory = data?.map(deal => ({
        id: deal.id,
        value: deal.value || 0,
        note: deal.note,
        created_at: deal.created_at,
        stage_name: deal.kanban_stages?.name
      })) || [];

      setDealHistory(formattedHistory);
    } catch (error) {
      console.error('Erro ao buscar histórico de negócios:', error);
    }
  };

  const fetchLeadTags = async () => {
    if (!contact.leadId || !user) return;

    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .select(`
          tag_id,
          tags(
            id,
            name,
            color
          )
        `)
        .eq('lead_id', contact.leadId);

      if (error) throw error;

      const tags = data?.map(item => ({
        id: item.tags.id,
        name: item.tags.name,
        color: item.tags.color
      })) || [];

      setLeadTags(tags);
    } catch (error) {
      console.error('Erro ao buscar tags do lead:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!contact.leadId) return;

    try {
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', contact.leadId)
        .eq('tag_id', tagId);

      if (error) throw error;

      setLeadTags(prev => prev.filter(tag => tag.id !== tagId));
      toast.success('Tag removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white/95 backdrop-blur-lg border-l border-white/20 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalhes do Lead</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>
                    {contact.name?.charAt(0) || contact.phone.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {contact.name || 'Sem nome'}
                  </h3>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLeadDetail(contact)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{contact.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{contact.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {contact.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {leadTags.length > 0 && (
            <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  Etiquetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {leadTags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deal History */}
          {dealHistory.length > 0 && (
            <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Histórico de Negócios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dealHistory.map((deal) => (
                    <div key={deal.id} className="border-l-2 border-blue-200 pl-3 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {formatCurrency(deal.value)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(deal.created_at)}
                        </span>
                      </div>
                      {deal.stage_name && (
                        <p className="text-xs text-gray-600 mt-1">
                          {deal.stage_name}
                        </p>
                      )}
                      {deal.note && (
                        <p className="text-xs text-gray-600 mt-1">
                          {deal.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lead Stats */}
          <Card className="bg-white/50 backdrop-blur-sm border border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total em negócios:</span>
                <span className="font-medium">
                  {formatCurrency(dealHistory.reduce((sum, deal) => sum + deal.value, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Número de negócios:</span>
                <span className="font-medium">{dealHistory.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Último contato:</span>
                <span className="font-medium">
                  {contact.lastMessageAt ? formatDate(contact.lastMessageAt) : 'Nunca'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
