
import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Shield, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SecuritySettingsTab() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar o company_id do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .single();
        
      if (!currentUser || currentUser.role !== 'admin') {
        toast.error("Você não tem permissão para gerenciar usuários");
        return;
      }
        
      // Buscar todos os usuários da empresa
      const { data, error } = await supabase
        .from('profiles')
        .select('*, auth_users:id(email, created_at)')
        .eq('company_id', currentUser.company_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error(error.message || "Não foi possível carregar os usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!email.trim()) {
      toast.error("Por favor, informe um email válido");
      return;
    }
    
    try {
      setInviting(true);
      
      // Buscar o company_id do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");
      
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();
        
      if (!currentUser) throw new Error("Perfil de usuário não encontrado");
      
      // Implementação fictícia - na produção, isso seria uma chamada para uma função edge
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aqui enviaria um email para o usuário com um link para registro
      toast.success(`Convite enviado para ${email}`);
      setEmail("");
      
    } catch (error: any) {
      console.error("Erro ao convidar usuário:", error);
      toast.error(error.message || "Não foi possível enviar o convite");
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success("Função do usuário atualizada");
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar função:", error);
      toast.error(error.message || "Não foi possível atualizar a função do usuário");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Shield className="h-5 w-5 mt-1" />
          <div>
            <CardTitle>Configurações de Segurança</CardTitle>
            <CardDescription>
              Gerencie usuários e permissões de acesso ao sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Convidar Novo Usuário</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Envie um convite para novos membros da equipe
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="Email do usuário" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sm:flex-1"
              />
              <Select 
                value={role} 
                onValueChange={setRole}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleInviteUser} 
                disabled={inviting}
                className="bg-ticlin hover:bg-ticlin/90 text-black"
              >
                {inviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Convidar
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Usuários da Empresa</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.auth_users?.email}</TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={user.role} 
                              onValueChange={(value) => handleChangeRole(user.id, value)}
                            >
                              <SelectTrigger className="h-8 w-[140px]">
                                <SelectValue placeholder="Função" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="seller">Vendedor</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
