
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigProps } from "./types";

export function PerformanceSettingsTab({ config, onConfigChange }: ConfigProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações de Performance</h3>
        <p className="text-sm text-muted-foreground">
          Otimize o sistema para ambiente de produção
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="maxInstances">Limite de Instâncias</Label>
          <Input
            id="maxInstances"
            type="number"
            min="10"
            max="1000"
            value={config.maxInstances}
            onChange={(e) => onConfigChange("maxInstances", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Número máximo de instâncias de WhatsApp permitidas no sistema
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="maxUsers">Limite de Usuários</Label>
          <Input
            id="maxUsers"
            type="number"
            min="10"
            max="10000"
            value={config.maxUsers}
            onChange={(e) => onConfigChange("maxUsers", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Número máximo de usuários permitidos no sistema
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="logRetention">Retenção de Logs (dias)</Label>
          <Input
            id="logRetention"
            type="number"
            min="1"
            max="365"
            value={config.logRetention}
            onChange={(e) => onConfigChange("logRetention", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Período de retenção de logs no sistema
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="cacheStrategy">Estratégia de Cache</Label>
          <Select 
            value={config.cacheStrategy || "memory"} 
            onValueChange={(value) => onConfigChange("cacheStrategy", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma estratégia de cache" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="memory">Memória</SelectItem>
              <SelectItem value="redis">Redis</SelectItem>
              <SelectItem value="none">Sem Cache</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define como o sistema armazena dados em cache para melhor desempenho
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
            <p className="text-xs text-muted-foreground">
              Desativa temporariamente o acesso ao sistema
            </p>
          </div>
          <Switch
            id="maintenanceMode"
            checked={config.maintenanceMode}
            onCheckedChange={(checked) => onConfigChange("maintenanceMode", checked)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maxQueriesPerMinute">Limite de Requisições por Minuto</Label>
          <Input
            id="maxQueriesPerMinute"
            type="number"
            min="10"
            max="10000"
            value={config.maxQueriesPerMinute || "1000"}
            onChange={(e) => onConfigChange("maxQueriesPerMinute", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Limite de requisições para evitar sobrecarga do servidor
          </p>
        </div>
      </div>
    </div>
  );
}
