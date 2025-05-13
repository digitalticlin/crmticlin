
import { useState } from "react";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Calendar, Filter } from "lucide-react";
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Mock data for logs
const mockLogs = [
  {
    id: "1",
    timestamp: "2024-05-13 16:45:23",
    event: "login",
    user: "joao@techsolutions.com",
    company: "Tech Solutions Ltda",
    details: "Login bem-sucedido",
    level: "info"
  },
  {
    id: "2",
    timestamp: "2024-05-13 16:40:12",
    event: "whatsapp_disconnected",
    user: "Sistema",
    company: "Marketing Digital SA",
    details: "Instância 'marketing_digital_vendas' desconectada",
    level: "warning"
  },
  {
    id: "3",
    timestamp: "2024-05-13 16:30:45",
    event: "company_created",
    user: "admin@ticlin.com",
    company: "Consultoria Empresarial",
    details: "Nova empresa criada",
    level: "info"
  },
  {
    id: "4",
    timestamp: "2024-05-13 16:15:33",
    event: "login_failed",
    user: "ricardo@eletronicosbrasil.com",
    company: "Comércio Eletrônico Brasil",
    details: "Tentativa de login falhou (senha incorreta)",
    level: "error"
  },
  {
    id: "5",
    timestamp: "2024-05-13 16:10:55",
    event: "plan_changed",
    user: "admin@ticlin.com",
    company: "Tech Solutions Ltda",
    details: "Plano alterado de 'Pro' para 'Business'",
    level: "info"
  },
  {
    id: "6",
    timestamp: "2024-05-13 15:50:21",
    event: "api_error",
    user: "Sistema",
    company: "Marketing Digital SA",
    details: "Falha na comunicação com Evolution API",
    level: "error"
  },
  {
    id: "7",
    timestamp: "2024-05-13 15:45:18",
    event: "whatsapp_connected",
    user: "carlos@marketingdigital.com",
    company: "Marketing Digital SA",
    details: "Instância 'marketing_digital_suporte' conectada",
    level: "info"
  }
];

export default function LogsPanel() {
  const [logs] = useState(mockLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || log.event === typeFilter;
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    
    return matchesSearch && matchesType && matchesLevel;
  });
  
  const getLevelBadge = (level: string) => {
    switch(level) {
      case "info":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Aviso</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Registros de Atividades</CardTitle>
              <CardDescription>
                Consulte todos os eventos e alertas do sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-1" /> Período
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" /> Exportar
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="login_failed">Falha de login</SelectItem>
                  <SelectItem value="whatsapp_connected">WhatsApp conectado</SelectItem>
                  <SelectItem value="whatsapp_disconnected">WhatsApp desconectado</SelectItem>
                  <SelectItem value="company_created">Empresa criada</SelectItem>
                  <SelectItem value="plan_changed">Plano alterado</SelectItem>
                  <SelectItem value="api_error">Erro de API</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{log.timestamp}</TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.company}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredLogs.length} de {logs.length} registros
          </div>
          <div className="text-sm flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3 w-3" /> Filtros avançados
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
