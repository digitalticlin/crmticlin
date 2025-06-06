
import { KanbanLead } from "@/types/kanban";
import { GlassmorphismContactsSection } from "./GlassmorphismContactsSection";
import { GlassmorphismDocumentSection } from "./GlassmorphismDocumentSection";

interface GlassmorphismBasicInfoProps {
  selectedLead: KanbanLead;
  onUpdateLead?: (updates: Partial<KanbanLead>) => void;
}

export const GlassmorphismBasicInfo = ({
  selectedLead,
  onUpdateLead
}: GlassmorphismBasicInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Seção de Contatos */}
      <GlassmorphismContactsSection
        phone={selectedLead.phone}
        email={selectedLead.email}
        address={selectedLead.address}
      />
      
      {/* Seção de Documentos/Empresa */}
      <GlassmorphismDocumentSection
        documentId={selectedLead.documentId}
        company={selectedLead.company}
      />
    </div>
  );
};
