
import { Textarea } from "@/components/ui/textarea";

interface NotesFieldProps {
  notes?: string;
  onUpdateNotes: (notes: string) => void;
}

export const NotesField = ({ notes, onUpdateNotes }: NotesFieldProps) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Observações</h3>
      <Textarea 
        placeholder="Adicione notas sobre este lead"
        value={notes || ""}
        onChange={(e) => onUpdateNotes(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
};
