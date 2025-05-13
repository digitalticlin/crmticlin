
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfigProps } from "./types";

export function ApiSettingsTab({ config, onConfigChange }: ConfigProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações de API</h3>
        <p className="text-sm text-muted-foreground">
          Configure os endpoints e integrações para ambiente de produção
        </p>
      </div>
      
      <Separator />

      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Alterar estas configurações pode afetar a operação do sistema. Certifique-se de que a API Evolution esteja corretamente configurada.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="apiUrl">URL da API Evolution</Label>
          <div className="flex items-center gap-2">
            <Input
              id="apiUrl"
              value={config.apiUrl}
              onChange={(e) => onConfigChange("apiUrl", e.target.value)}
              placeholder="https://api.evolution.com"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Mais informações</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    URL base da API Evolution para integração com WhatsApp. Exemplo: https://api.evolution.com
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="webhookUrl">URL do Webhook</Label>
          <div className="flex items-center gap-2">
            <Input
              id="webhookUrl"
              value={config.webhookUrl}
              onChange={(e) => onConfigChange("webhookUrl", e.target.value)}
              placeholder="https://ticlin.com.br/api/webhook/evolution"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Mais informações</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    URL que receberá as atualizações de eventos do WhatsApp.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="apiMaxRetries">Número Máximo de Tentativas</Label>
          <Input
            id="apiMaxRetries"
            type="number"
            min="1"
            max="10"
            value={config.apiMaxRetries || "3"}
            onChange={(e) => onConfigChange("apiMaxRetries", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="apiTimeout">Timeout da API (ms)</Label>
          <Input
            id="apiTimeout"
            type="number"
            min="1000"
            max="60000"
            value={config.apiTimeout || "30000"}
            onChange={(e) => onConfigChange("apiTimeout", e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="debugMode">Modo de Depuração</Label>
            <p className="text-xs text-muted-foreground">
              Ativa logs detalhados de API para troubleshooting
            </p>
          </div>
          <Switch
            id="debugMode"
            checked={config.debugMode}
            onCheckedChange={(checked) => onConfigChange("debugMode", checked)}
          />
        </div>

        <Separator className="my-4" />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced-settings">
            <AccordionTrigger>Configurações Avançadas</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="apiAuthHeader">Cabeçalho de Autenticação</Label>
                  <Input
                    id="apiAuthHeader"
                    value={config.apiAuthHeader || "apikey"}
                    onChange={(e) => onConfigChange("apiAuthHeader", e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useHttps">Forçar HTTPS</Label>
                    <p className="text-xs text-muted-foreground">
                      Exige conexões seguras para todas as chamadas de API
                    </p>
                  </div>
                  <Switch
                    id="useHttps"
                    checked={config.useHttps || true}
                    onCheckedChange={(checked) => onConfigChange("useHttps", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="apiCaching">Cache de Respostas</Label>
                    <p className="text-xs text-muted-foreground">
                      Armazena temporariamente respostas para melhor performance
                    </p>
                  </div>
                  <Switch
                    id="apiCaching"
                    checked={config.apiCaching || false}
                    onCheckedChange={(checked) => onConfigChange("apiCaching", checked)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
