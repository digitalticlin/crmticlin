
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Calendar, CircleCheck, Loader, X, Trash2, Pencil, Play, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BroadcastStatus = "waiting" | "sending" | "completed" | "error" | "paused";

interface BroadcastList {
  id: string;
  name: string;
  status: BroadcastStatus;
  progress: number;
  contactsCount: number;
  sentCount: number;
  createdAt: string;
  scheduledTime: string;
  senderPhone: string;
}

export function BroadcastLists() {
  const { toast } = useToast();
  
  // Mock data for lists
  const [lists, setLists] = useState<BroadcastList[]>([
    {
      id: "1",
      name: "Promoção de Maio",
      status: "sending",
      progress: 35,
      contactsCount: 150,
      sentCount: 52,
      createdAt: "2025-05-10",
      scheduledTime: "08:00 - 18:00",
      senderPhone: "Atendimento Principal"
    },
    {
      id: "2",
      name: "Novidades Junho",
      status: "waiting",
      progress: 0,
      contactsCount: 78,
      sentCount: 0,
      createdAt: "2025-05-11",
      scheduledTime: "09:00 - 17:00",
      senderPhone: "Vendas"
    },
    {
      id: "3",
      name: "Follow-up Clientes Inativos",
      status: "completed",
      progress: 100,
      contactsCount: 45,
      sentCount: 45,
      createdAt: "2025-05-05",
      scheduledTime: "10:00 - 16:00",
      senderPhone: "Atendimento Principal"
    },
    {
      id: "4",
      name: "Pesquisa de Satisfação",
      status: "error",
      progress: 12,
      contactsCount: 200,
      sentCount: 24,
      createdAt: "2025-05-08",
      scheduledTime: "08:00 - 18:00",
      senderPhone: "Vendas"
    }
  ]);
  
  const getStatusBadge = (status: BroadcastStatus) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Aguardando</Badge>;
      case "sending":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Enviando</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Concluída</Badge>;
      case "paused":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Pausada</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Erro</Badge>;
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: BroadcastStatus) => {
    switch (status) {
      case "sending":
        return <Loader className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />;
      case "completed":
        return <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "error":
        return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };
  
  const handleDelete = (id: string) => {
    setLists(lists.filter(list => list.id !== id));
    toast({
      title: "Lista removida",
      description: "A lista de transmissão foi removida com sucesso."
    });
  };
  
  const handleAction = (list: BroadcastList, action: 'start' | 'stop') => {
    let newStatus: BroadcastStatus;
    let message: string;
    
    if (action === 'start') {
      newStatus = 'sending';
      message = "Disparo iniciado com sucesso!";
    } else {
      newStatus = 'paused';
      message = "Disparo pausado com sucesso!";
    }
    
    setLists(lists.map(item => 
      item.id === list.id ? {...item, status: newStatus} : item
    ));
    
    toast({
      title: action === 'start' ? "Iniciando disparo" : "Pausando disparo",
      description: message
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Calendar className="h-5 w-5 text-primary mr-2" />
            Listas de Transmissão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lists.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Contatos</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">{list.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(list.status)}
                          {getStatusBadge(list.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-[120px] space-y-1">
                          <Progress value={list.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground text-right">
                            {list.sentCount}/{list.contactsCount}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{list.contactsCount}</TableCell>
                      <TableCell>{list.senderPhone}</TableCell>
                      <TableCell>{list.scheduledTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(list.status === 'waiting' || list.status === 'paused') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAction(list, 'start')}
                              className="h-8 px-2"
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          
                          {list.status === 'sending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAction(list, 'stop')}
                              className="h-8 px-2"
                            >
                              <StopCircle className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          
                          {list.status === 'waiting' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {(list.status === 'waiting' || list.status === 'completed' || list.status === 'error') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(list.id)}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma lista de transmissão encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
