
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, BarChart3, Trash2, Shield, Users } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamManagement";

interface TeamMembersListProps {
  members: TeamMember[];
  onRemoveMember: (memberId: string) => Promise<void>;
}

export const TeamMembersList = ({ members, onRemoveMember }: TeamMembersListProps) => {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    try {
      setRemovingMemberId(memberId);
      await onRemoveMember(memberId);
    } catch (error) {
      console.error("Erro ao remover membro:", error);
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (members.length === 0) {
    return (
      <Card className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum membro da equipe</h3>
          <p className="text-gray-600">Adicione membros para começar a colaborar em equipe.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.id} className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-800">{member.full_name}</CardTitle>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                  <Shield className="h-3 w-3 mr-1" />
                  {member.role === 'admin' ? 'Administrador' : 'Operacional'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={removingMemberId === member.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Access */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">WhatsApp ({member.whatsapp_access?.length || 0})</span>
                </div>
                {member.whatsapp_access && member.whatsapp_access.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {member.whatsapp_access.slice(0, 3).map((whatsappId) => (
                      <Badge key={whatsappId} variant="outline" className="text-xs">
                        {whatsappId.substring(0, 8)}...
                      </Badge>
                    ))}
                    {member.whatsapp_access.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.whatsapp_access.length - 3} mais
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Nenhum acesso</p>
                )}
              </div>

              {/* Funnel Access */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Funis ({member.funnel_access?.length || 0})</span>
                </div>
                {member.funnel_access && member.funnel_access.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {member.funnel_access.slice(0, 3).map((funnelId) => (
                      <Badge key={funnelId} variant="outline" className="text-xs">
                        {funnelId.substring(0, 8)}...
                      </Badge>
                    ))}
                    {member.funnel_access.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.funnel_access.length - 3} mais
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Nenhum acesso</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-gray-600">
                Acesso total: {(member.whatsapp_access?.length || 0) + (member.funnel_access?.length || 0)} recursos
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
