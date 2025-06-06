
import { Contact } from "@/types/chat";
import { Textarea } from "@/components/ui/textarea";

interface NotesSectionProps {
  selectedContact: Contact;
  editedContact: Partial<Contact>;
  setEditedContact: (contact: Partial<Contact>) => void;
  onSave: () => void;
}

export const NotesSection = ({
  selectedContact,
  editedContact,
  setEditedContact,
  onSave
}: NotesSectionProps) => {
  const currentContact = { ...selectedContact, ...editedContact };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Notas</h3>
      <Textarea
        value={editedContact.notes || currentContact.notes || ''}
        onChange={(e) => setEditedContact({...editedContact, notes: e.target.value})}
        placeholder="Adicione suas anotações sobre este lead..."
        className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 min-h-[120px] resize-none"
        onBlur={onSave}
      />
    </div>
  );
};
