
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TimePickerInput } from "@/components/automation/TimePickerInput";
import { Upload, Download, Play, Phone, Clock, Info, ListPlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface NewBroadcastListFormProps {
  onSuccess: () => void;
}

export function NewBroadcastListForm({ onSuccess }: NewBroadcastListFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phoneId, setPhoneId] = useState("");
  const [messages, setMessages] = useState(["", "", ""]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [previewNumbers, setPreviewNumbers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Mock phone numbers already connected
  const connectedPhones = [
    { id: "1", name: "Atendimento Principal", number: "+55 11 9999-8888", status: "active" },
    { id: "2", name: "Vendas", number: "+55 11 9999-7777", status: "inactive" },
  ];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      // In a real app, parse the Excel file here
      setPreviewNumbers([
        "+5562999991111",
        "+5562999992222",
        "+5562999993333",
        "+5562999994444",
        "+5562999995555",
      ]);
      
      toast({
        title: "Arquivo carregado",
        description: `${selectedFile.name} - ${previewNumbers.length} números detectados`
      });
    }
  };
  
  const handleMessageChange = (index: number, value: string) => {
    const newMessages = [...messages];
    newMessages[index] = value;
    setMessages(newMessages);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUploading(false);
      onSuccess();
    }, 1500);
  };
  
  const handleDownloadTemplate = () => {
    toast({
      title: "Modelo baixado",
      description: "O modelo de planilha foi baixado com sucesso."
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListPlus className="h-5 w-5 text-ticlin mr-2" />
            Nova Lista de Transmissão
          </CardTitle>
          <CardDescription>
            Configure sua lista de contatos e mensagens para disparo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* List Name */}
          <div className="grid gap-2">
            <Label htmlFor="list-name">Nome da lista</Label>
            <Input 
              id="list-name"
              placeholder="Ex: Promoção de Maio" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {/* Contact Upload */}
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <Label>Contatos (Upload)</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadTemplate}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Baixar modelo
              </Button>
            </div>
            
            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <Input 
                id="contact-file"
                type="file" 
                accept=".xlsx,.xls,.csv" 
                className="hidden"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="contact-file" 
                className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {file ? file.name : "Arraste ou clique para selecionar"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formato .xlsx com coluna de número no formato internacional (556299999999)
                </p>
              </label>
            </div>
            
            {previewNumbers.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-sm font-medium mb-2">Pré-visualização ({previewNumbers.length} números):</p>
                <div className="flex flex-wrap gap-2">
                  {previewNumbers.slice(0, 5).map((number, index) => (
                    <Badge key={index} variant="outline" className="bg-background/80">{number}</Badge>
                  ))}
                  {previewNumbers.length > 5 && (
                    <Badge variant="outline" className="bg-background/80">+{previewNumbers.length - 5}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Sender Phone Selection */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-ticlin" />
              <Label htmlFor="sender-phone">Telefone Remetente</Label>
            </div>
            <Select value={phoneId} onValueChange={setPhoneId} required>
              <SelectTrigger id="sender-phone" className="w-full">
                <SelectValue placeholder="Selecione um número" />
              </SelectTrigger>
              <SelectContent>
                {connectedPhones.map((phone) => (
                  <SelectItem key={phone.id} value={phone.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{phone.name} ({phone.number})</span>
                      <Badge 
                        className={phone.status === 'active' ? 'bg-green-500' : 'bg-red-500'}
                      >
                        {phone.status === 'active' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Message Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variações de Mensagens</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    Para evitar bloqueios, o sistema irá alternar entre estas mensagens durante o envio.
                    Evite conteúdo promocional explícito ou links suspeitos.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`message-${index}`}>Mensagem {index + 1}{index === 0 ? " (obrigatória)" : " (opcional)"}</Label>
                <Textarea 
                  id={`message-${index}`}
                  placeholder={`Digite a variação ${index + 1} da mensagem`}
                  value={messages[index]}
                  onChange={(e) => handleMessageChange(index, e.target.value)}
                  required={index === 0}
                  className="min-h-[100px]"
                />
              </div>
            ))}
          </div>
          
          <Separator />
          
          {/* Time Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ticlin" />
              <Label>Intervalo de Horário para Envios</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Horário de Início</Label>
                <TimePickerInput 
                  id="start-time"
                  value={startTime}
                  onChange={setStartTime}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Horário de Término</Label>
                <TimePickerInput 
                  id="end-time"
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground italic">
              Recomendamos utilizar horário comercial (8h às 18h) para melhores resultados.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => setActiveTab("lists")}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-ticlin hover:bg-ticlin/90 text-black"
            disabled={isUploading || !name || !phoneId || !messages[0] || !file}
          >
            {isUploading ? (
              <>Criando lista...</>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Disparo
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
