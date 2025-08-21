import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, CheckCheck, ChevronDown, ChevronUp, Coins, Copy, Edit, Mail, Phone, Plus, Search, User } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Link } from 'react-router-dom';

interface LeadDetailsSidebarProps {
  lead: any;
  onUpdate: (lead: any) => void;
  onDelete: (lead: any) => void;
}

interface DealHistoryItem {
  id: string;
  type: 'win' | 'loss';
  value: number;
  date: string;
  stage: string;
  notes?: string;
}

export const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({ lead, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(lead?.name || '');
  const [phone, setPhone] = React.useState(lead?.phone || '');
  const [email, setEmail] = React.useState(lead?.email || '');
  const [notes, setNotes] = React.useState(lead?.notes || '');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedStage, setSelectedStage] = React.useState(lead?.kanban_stage_id || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutate: updateLead, isLoading: isUpdating } = useMutation(
    async (leadData: any) => {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', lead.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Lead atualizado com sucesso!",
        });
        onUpdate(data);
        setIsEditing(false);
        queryClient.invalidateQueries(['leads']);
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao atualizar lead.",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  const { mutate: deleteLead, isLoading: isDeleting } = useMutation(
    async () => {
      const { data, error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) {
        throw error;
      }
      return data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Lead deletado com sucesso!",
        });
        onDelete(lead);
        setIsDeleteDialogOpen(false);
        queryClient.invalidateQueries(['leads']);
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao deletar lead.",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setName(lead?.name || '');
    setPhone(lead?.phone || '');
    setEmail(lead?.email || '');
    setNotes(lead?.notes || '');
  };

  const handleSaveClick = async () => {
    const updatedLead = {
      name: name,
      phone: phone,
      email: email,
      notes: notes,
    };

    updateLead(updatedLead);
  };

  const handleDeleteClick = () => {
    deleteLead();
  };

  const stages = [
    { id: '1', title: 'Contato Inicial' },
    { id: '2', title: 'Qualificação' },
    { id: '3', title: 'Proposta' },
    { id: '4', title: 'Negociação' },
    { id: '5', title: 'Fechamento' },
  ];

  const dealHistory: DealHistoryItem[] = [
    {
      id: '1',
      type: 'win' as const, // Fix: Use 'win' instead of 'won'
      value: 1500,
      date: '2024-01-15',
      stage: 'Fechamento',
      notes: 'Cliente fechou pacote premium'
    },
    {
      id: '2', 
      type: 'loss' as const, // Fix: Use 'loss' instead of 'lost'
      value: 800,
      date: '2024-01-10',
      stage: 'Negociação',
      notes: 'Não teve budget aprovado'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isEditing ? 'Editando Lead' : lead?.name}
          </CardTitle>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleCancelClick}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveClick}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            ) : (
              <Button onClick={handleEditClick}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Detalhes e histórico do lead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${lead?.name}`} />
            <AvatarFallback>{lead?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{lead?.name}</p>
            <p className="text-sm text-muted-foreground">
              {lead?.phone}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Anotações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Contato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={!isEditing}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      `${format(date.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(date.to, "dd/MM/yyyy", { locale: ptBR })}`
                    ) : (
                      format(date.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  disabled={!isEditing}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa do Funil</Label>
            <Select onValueChange={setSelectedStage} defaultValue={selectedStage} disabled={!isEditing}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium">Histórico de Negociações</h3>
          <Table>
            <TableCaption>Ações recentes do lead.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Etapa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealHistory.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.type === 'win' ? 'Ganho' : 'Perda'}</TableCell>
                  <TableCell>{deal.value}</TableCell>
                  <TableCell>{deal.date}</TableCell>
                  <TableCell>{deal.stage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  <Button variant="link" size="sm">
                    Ver tudo
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isEditing}>
              Deletar Lead
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os dados do lead serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteClick} disabled={isDeleting}>
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
