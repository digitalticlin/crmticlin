import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstanceWithPhone {
  id: string;
  instance_name: string;
  phone: string;
  originalPhone: string;
  needsFix: boolean;
}

export const PhoneNumberFixer = () => {
  const [instances, setInstances] = useState<InstanceWithPhone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const scanPhoneNumbers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone')
        .not('phone', 'is', null);

      if (error) throw error;

      const processedInstances = data.map(instance => {
        const needsFix = instance.phone?.includes(':') || false;
        const cleanedPhone = instance.phone?.split(':')[0] || instance.phone;
        
        return {
          id: instance.id,
          instance_name: instance.instance_name,
          phone: cleanedPhone,
          originalPhone: instance.phone,
          needsFix
        };
      });

      setInstances(processedInstances);
      setHasScanned(true);
      
      const fixCount = processedInstances.filter(i => i.needsFix).length;
      toast.success(`Escaneamento concluído! ${fixCount} números precisam de correção.`);
      
    } catch (error: any) {
      console.error('[Phone Fixer] Erro ao escanear:', error);
      toast.error(`Erro ao escanear: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixPhoneNumbers = async () => {
    setIsLoading(true);
    try {
      // Buscar instâncias com formato problemático
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone')
        .like('phone', '%:%');

      if (error) throw error;

      console.log('Instâncias encontradas com formato problemático:', data);
      
      let fixedCount = 0;
      for (const instance of data) {
        const cleanPhone = instance.phone.split(':')[0];
        
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({ phone: cleanPhone })
          .eq('id', instance.id);

        if (!updateError) {
          fixedCount++;
          console.log(`✅ Corrigido: ${instance.instance_name} - ${instance.phone} → ${cleanPhone}`);
        } else {
          console.error(`❌ Erro ao corrigir ${instance.instance_name}:`, updateError);
        }
      }

      toast.success(`${fixedCount} números de telefone corrigidos!`);
      
    } catch (error: any) {
      console.error('Erro ao corrigir números:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Corretor de Números de Telefone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problema Identificado:</strong> Alguns números de telefone possuem sufixos 
            desnecessários como ":11" ou ":18" que podem causar confusão na interface.
            Esta ferramenta remove esses sufixos, mantendo apenas o número limpo.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={scanPhoneNumbers}
            disabled={isLoading || isFixing}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Escanear Números
              </>
            )}
          </Button>

          {hasScanned && (
            <Button
              onClick={fixPhoneNumbers}
              disabled={isLoading || isFixing || instances.filter(i => i.needsFix).length === 0}
              className="flex-1"
              variant="default"
            >
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Corrigir {instances.filter(i => i.needsFix).length} Números
                </>
              )}
            </Button>
          )}
        </div>

        {hasScanned && instances.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Resultados do Escaneamento:</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {instances.map((instance) => (
                <div 
                  key={instance.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{instance.instance_name}</div>
                    <div className="text-sm text-gray-600">
                      {instance.needsFix ? (
                        <>
                          <span className="line-through text-red-600">{instance.originalPhone}</span>
                          {' → '}
                          <span className="text-green-600">{instance.phone}</span>
                        </>
                      ) : (
                        <span className="text-green-600">{instance.phone}</span>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={instance.needsFix ? "destructive" : "default"}>
                    {instance.needsFix ? "Precisa Correção" : "OK"}
                  </Badge>
                </div>
              ))}
            </div>

            {instances.length > 0 && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {instances.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {instances.filter(i => i.needsFix).length}
                  </div>
                  <div className="text-sm text-gray-600">Precisam Correção</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {instances.filter(i => !i.needsFix).length}
                  </div>
                  <div className="text-sm text-gray-600">Corretos</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 