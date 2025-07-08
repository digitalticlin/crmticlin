
import { useState } from "react";
import { Contact } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Save, Edit } from "lucide-react";

interface NotesSectionProps {
  selectedContact: Contact;
  editedContact: Partial<Contact>;
  setEditedContact: (contact: Partial<Contact>) => void;
  onSave?: () => void;
  onUpdateNotes: (notes: string) => void;
}

export const NotesSection = ({
  selectedContact,
  editedContact,
  setEditedContact,
  onSave,
  onUpdateNotes
}: NotesSectionProps) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentNotes = editedContact.notes !== undefined 
    ? editedContact.notes 
    : selectedContact.notes || '';

  const startEditingNotes = () => {
    setIsEditingNotes(true);
    setTempNotes(currentNotes);
  };

  const saveNotes = async () => {
    if (tempNotes === currentNotes) {
      setIsEditingNotes(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateNotes(tempNotes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEditingNotes = () => {
    setIsEditingNotes(false);
    setTempNotes('');
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-lime-400" />
          Observações
        </h3>
        {!isEditingNotes && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={startEditingNotes}
            className="text-lime-400 hover:text-lime-500 hover:bg-lime-50 rounded-lg text-xs px-2 py-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
        )}
      </div>

      {isEditingNotes ? (
        <div className="space-y-3">
          <Textarea
            value={tempNotes}
            onChange={(e) => setTempNotes(e.target.value)}
            placeholder="Adicione observações sobre este lead..."
            className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 min-h-[100px] text-sm resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              onClick={saveNotes}
              disabled={isLoading}
              className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg rounded-lg font-semibold text-sm h-8 px-3"
            >
              <Save className="h-3 w-3 mr-1" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              variant="outline"
              onClick={cancelEditingNotes}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 text-sm h-8 px-3"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="min-h-[60px] p-3 bg-gray-50/60 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-100/60 transition-colors border border-transparent hover:border-lime-400/30"
          onClick={startEditingNotes}
        >
          {currentNotes || (
            <span className="text-gray-400 italic">
              Clique para adicionar observações sobre este lead...
            </span>
          )}
        </div>
      )}
    </div>
  );
};
