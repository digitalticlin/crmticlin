
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit, Save, X, FileText } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface NotesSectionProps {
  client: ClientData;
  onUpdateNotes: (notes: string) => void;
}

export function NotesSection({ client, onUpdateNotes }: NotesSectionProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(client.notes || "");

  const handleSaveNotes = () => {
    onUpdateNotes(notesValue);
    setIsEditingNotes(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5 text-[#d3d800]" />
        <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
      </div>
      
      {isEditingNotes ? (
        <div className="space-y-3">
          <Textarea
            placeholder="Adicione observações sobre o cliente..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSaveNotes}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditingNotes(false);
                setNotesValue(client.notes || "");
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {client.notes ? (
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
            ) : (
              <p className="text-gray-500 italic">Nenhuma observação adicionada</p>
            )}
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsEditingNotes(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
