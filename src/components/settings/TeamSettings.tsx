
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useTeamAuxiliaryData } from "@/hooks/settings/useTeamAuxiliaryData";
import { InviteMemberModal } from "./InviteMemberModal";
import { TeamHeader } from "./team/TeamHeader";
import { TeamMembersList } from "./team/TeamMembersList";

export default function TeamSettings() {
  console.log('[TeamSettings] Component rendering');
  
  const { companyId } = useCompanyData();
  const {
    members,
    loading,
    inviteTeamMember,
    removeTeamMember,
  } = useTeamManagement(companyId);

  const { allWhatsApps, allFunnels, auxDataLoading } = useTeamAuxiliaryData(companyId);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  // Refs para controlar execuções
  const isUnmountedRef = useRef(false);

  // Cleanup no desmonte
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      console.log('[TeamSettings] Component unmounting');
    };
  }, []);

  if (loading || auxDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
      </div>
    );
  }

  return (
    <div>
      <TeamHeader onAddMember={() => setInviteModalOpen(true)} />

      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={inviteTeamMember}
        loading={loading}
        allWhatsApps={allWhatsApps}
        allFunnels={allFunnels}
      />

      <TeamMembersList 
        members={members}
        onRemoveMember={removeTeamMember}
      />
    </div>
  );
}
