
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StickyNote, Edit, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface NotesSectionProps {
  client: ClientData;
  onUpdateNotes?: (notes: string) => void;
  isCreateMode?: boolean;
}

export function NotesSection({ client, onUpdateNotes, isCreateMode = false }: NotesSectionProps) {
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [editedNotes, setEditedNotes] = useState(client.notes || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!onUpdateNotes) return;

    if (isCreateMode) {
      onUpdateNotes(editedNotes);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateNotes(editedNotes);
      setIsEditing(false);
    } catch (error) {
      // Error is handled in the parent hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StickyNote className="h-5 w-5 text-[#d3d800]" />
          <h3 className="text-lg font-semibold text-white">Observações</h3>
        </div>
        {!isEditing && !isCreateMode && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div>
        {isEditing || isCreateMode ? (
          <div className="space-y-4">
            <Textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Adicione observações sobre este cliente..."
              className="min-h-[120px] bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 resize-none"
            />
            
            {!isCreateMode && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedNotes(client.notes || "");
                  }}
                  className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/80 min-h-[60px] whitespace-pre-wrap">
            {client.notes || 'Nenhuma observação adicionada.'}
          </p>
        )}
      </div>
    </div>
  );
}
