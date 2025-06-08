
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { OptimizedWhatsAppConnection } from "./OptimizedWhatsAppConnection";

export const WhatsAppWebSection = () => {
  console.log('[WhatsApp Web Section] 🎯 Interface Otimizada com Fluxo Híbrido');

  return (
    <Card className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-glass">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/20">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Conexões WhatsApp
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie suas instâncias WhatsApp Web.js com fluxo híbrido otimizado
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ✨ Fluxo Híbrido Otimizado
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>Criação Rápida:</strong> Instância criada → Modal abre automaticamente</li>
            <li>• <strong>Polling Inteligente:</strong> QR Code gerado em até 2 minutos (timeout automático)</li>
            <li>• <strong>Anti-Polling-Infinito:</strong> Máximo 8 tentativas com progresso visual</li>
            <li>• <strong>Fallback Manual:</strong> Sempre disponível em caso de timeout</li>
          </ul>
        </div>
        
        <OptimizedWhatsAppConnection />
      </CardContent>
    </Card>
  );
};
