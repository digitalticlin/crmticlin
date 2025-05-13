
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [position, setPosition] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Função para extrair o nome de usuário do email
  const generateUsername = (email: string) => {
    return email.split("@")[0];
  };

  // Carregar os dados do perfil quando o componente é montado
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        setUser(session.user);
        setEmail(session.user.email || "");
        setUsername(generateUsername(session.user.email || ""));
        
        // Buscar os dados do perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Erro ao carregar perfil:", error);
          toast.error("Não foi possível carregar os dados do perfil");
        } else if (profile) {
          setFullName(profile.full_name || "");
          setDocumentId(profile.document_id || "");
          setWhatsapp(profile.whatsapp || "");
          setPosition(profile.position || "");
          setAvatarUrl(profile.avatar_url);
          
          // Buscar dados da empresa do usuário
          if (profile.company_id) {
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .single();
              
            if (company) {
              setCompanyName(company.name);
            }
          }
        }
      } catch (error) {
        console.error("Erro:", error);
        toast.error("Ocorreu um erro ao carregar seus dados");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Atualizar o nome de usuário quando o email mudar
  useEffect(() => {
    const newUsername = generateUsername(email);
    setUsername(newUsername);
  }, [email]);

  // Função para lidar com a mudança de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Função para salvar as alterações do perfil
  const handleSaveChanges = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Atualizar o perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          document_id: documentId,
          whatsapp: whatsapp,
          position: position,
          updated_at: new Date()
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Não foi possível atualizar o perfil");
    } finally {
      setSaving(false);
    }
  };

  // Função para lidar com alteração de senha
  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Email para redefinição de senha enviado!");
    } catch (error: any) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast.error(error.message || "Não foi possível solicitar redefinição de senha");
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
        </CardContent>
      </Card>
    );
  }

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
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={fullName} />
            ) : (
              <AvatarFallback className="bg-ticlin/20 text-black text-2xl">
                {fullName ? fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            )}
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
            <Input 
              id="name" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
            />
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
            <Input 
              id="company" 
              value={companyName} 
              disabled={true}
              className="bg-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="documentId">CPF/CNPJ</Label>
            <Input 
              id="documentId" 
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="whatsapp" 
                className="pl-8"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input 
              id="position" 
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Segurança da Conta</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={handleChangePassword}
            >
              Alterar senha
            </Button>
            <p className="text-sm text-muted-foreground">
              Um email será enviado com instruções para alterar sua senha
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
          <Button 
            variant="outline"
            onClick={() => {
              // Recarregar os dados originais
              setLoading(true);
              window.location.reload();
            }}
          >
            Cancelar
          </Button>
          <Button 
            className="bg-ticlin hover:bg-ticlin/90 text-black"
            onClick={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
