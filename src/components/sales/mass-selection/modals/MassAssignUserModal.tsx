import { useState, useEffect } from "react";
import { KanbanLead } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { 
  MassActionsService, 
  UserOption 
} from "@/services/massActions/massActionsService";

interface MassAssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: KanbanLead[];
  onSuccess: () => void;
}

export const MassAssignUserModal = ({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess
}: MassAssignUserModalProps) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [teamUsers, setTeamUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const selectedCount = selectedLeads.length;

  // Carregar usuários da equipe
  useEffect(() => {
    const loadTeamUsers = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const userOptions = await MassActionsService.getUsers();
        setTeamUsers(userOptions);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários da equipe');
      } finally {
        setLoading(false);
      }
    };

    loadTeamUsers();
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedUserId || selectedCount === 0) return;

    setIsAssigning(true);
    
    try {
      const leadIds = selectedLeads.map(lead => lead.id);
      const result = await MassActionsService.assignUserToLeads(leadIds, selectedUserId);

      if (result.success) {
        const assignedUser = teamUsers.find(u => u.id === selectedUserId);
        const userName = assignedUser?.full_name || assignedUser?.email || 'Usuário';

        toast.success(
          `${selectedCount} lead${selectedCount > 1 ? 's' : ''} atribuído${selectedCount > 1 ? 's' : ''} para ${userName}!`
        );
        
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao atribuir leads:', error);
      toast.error('Erro inesperado ao atribuir leads');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    onClose();
  };

  const selectedUser = teamUsers.find(u => u.id === selectedUserId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-700">
            <User size={20} />
            Atribuir Responsável
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-gray-600">
            Atribuindo responsável para{' '}
            <strong className="text-gray-800">{selectedCount}</strong>{' '}
            lead{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
          </p>

          <div>
            <Label htmlFor="user-select" className="text-sm font-medium">
              Selecionar Responsável
            </Label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="user-select" className="mt-1">
                  <SelectValue placeholder="Escolha um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {teamUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(user.full_name || user.email || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'Sem nome'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <UserCheck size={16} className="text-gray-600" />
              <div>
                <div className="font-medium text-gray-700">
                  {selectedUser.full_name || 'Sem nome'}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedUser.email}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isAssigning}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={isAssigning || !selectedUserId}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800"
          >
            {isAssigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Atribuindo...
              </>
            ) : (
              <>
                <UserCheck size={16} />
                Confirmar Atribuição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};