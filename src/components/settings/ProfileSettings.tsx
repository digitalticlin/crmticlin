
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ProfileSettings = () => {
  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>
          Gerencie suas informações de perfil e dados da conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-ticlin/20 text-black text-2xl">
              A
            </AvatarFallback>
          </Avatar>
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              Alterar foto
            </Button>
            <Button variant="outline" size="sm" className="text-red-600">
              Remover
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" defaultValue="Admin User" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue="admin@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" defaultValue="Ticlin CRM" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input id="position" defaultValue="Administrador" />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Segurança da Conta</h3>
          <div className="space-y-2">
            <Button variant="outline">Alterar senha</Button>
            <p className="text-sm text-muted-foreground">
              Última alteração de senha: 15/03/2024
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação de dois fatores</Label>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <Switch />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancelar</Button>
          <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
