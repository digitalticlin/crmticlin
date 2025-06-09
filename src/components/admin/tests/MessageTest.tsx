
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSendingService } from "@/services/whatsapp/services/messageSendingService";
import { MessageSendResponse } from "@/services/whatsapp/types/whatsappWebTypes";
import { MessageSquare, Send, AlertTriangle, CheckCircle } from "lucide-react";

export const MessageTest = () => {
  const [instanceId, setInstanceId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MessageSendResponse | null>(null);

  const handleSendMessage = async () => {
    if (!instanceId || !phone || !message) {
      setResult({
        success: false,
        error: "Todos os campos são obrigatórios"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log('[MessageTest] 📤 Enviando mensagem de teste...');
      
      const response = await MessageSendingService.sendMessage(
        instanceId,
        phone,
        message
      );
      
      console.log('[MessageTest] 📥 Resposta recebida:', response);
      setResult(response);
      
    } catch (error: any) {
      console.error('[MessageTest] ❌ Erro no teste:', error);
      setResult({
        success: false,
        error: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Teste de Envio de Mensagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ID da Instância</label>
            <Input
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="ID da instância WhatsApp"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5511999999999"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem de teste..."
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSendMessage}
          disabled={isLoading || !instanceId || !phone || !message}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Mensagem
            </div>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <AlertDescription className="flex-1">
                {result.success ? (
                  <div className="space-y-1">
                    <p className="font-medium text-green-900">✅ Mensagem enviada com sucesso!</p>
                    {/* CORREÇÃO: Usar propriedade messageId que agora existe */}
                    {result.messageId && (
                      <p className="text-sm text-green-700">ID da mensagem: {result.messageId}</p>
                    )}
                    {result.timestamp && (
                      <p className="text-sm text-green-700">Timestamp: {result.timestamp}</p>
                    )}
                    {result.leadId && (
                      <p className="text-sm text-green-700">Lead ID: {result.leadId}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-900">❌ Falha no envio</p>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
