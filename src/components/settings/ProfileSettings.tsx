
import { useState, useEffect } from "react";
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
import { Phone } from "lucide-react";

const ProfileSettings = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [username, setUsername] = useState("admin");

  // Função para extrair o nome de usuário do email
  const generateUsername = (email: string) => {
    return email.split("@")[0];
  };

  // Atualizar o nome de usuário quando o email mudar
  useEffect(() => {
    const newUsername = generateUsername(email);
    setUsername(newUsername);
  }, [email]);

  // Função para lidar com a mudança de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

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
            <Input 
              id="email" 
              value={email} 
              onChange={handleEmailChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input 
              id="username" 
              value={username} 
              className="bg-gray-100" 
              readOnly 
            />
            <p className="text-xs text-muted-foreground">
              Gerado automaticamente com base no email
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" defaultValue="Ticlin CRM" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="documentId">CPF/CNPJ</Label>
            <Input id="documentId" defaultValue="123.456.789-00" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="whatsapp" 
                className="pl-8" 
                defaultValue="(11) 99999-9999" 
              />
            </div>
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
