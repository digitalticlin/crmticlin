
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from "lucide-react";
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-[#d3d800]/30 shadow-xl shadow-[#d3d800]/10">
      <h3 className="font-semibold text-white border-b border-[#d3d800]/30 pb-2 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-[#d3d800] rounded-full shadow-lg shadow-[#d3d800]/50"></div>
        Observações
      </h3>
      {isEditingNotes ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Adicione observações sobre o cliente..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="min-h-[100px] bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSaveNotes}
              className="bg-[#d3d800]/80 hover:bg-[#d3d800] text-black border-2 border-[#d3d800] shadow-lg font-semibold"
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
              className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
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
              <p className="text-sm text-white whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-sm text-white/60 italic">Nenhuma observação adicionada</p>
            )}
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsEditingNotes(true)}
            className="text-[#d3d800] hover:text-black hover:bg-[#d3d800]/20"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
