
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StickyNote, Edit, Save, X } from "lucide-react";

interface GlassmorphismNotesProps {
  notes?: string;
  onUpdateNotes: (notes: string) => void;
}

export const GlassmorphismNotes = ({
  notes,
  onUpdateNotes
}: GlassmorphismNotesProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notesValue, setNotesValue] = useState(notes || "");

  const handleSave = () => {
    onUpdateNotes(notesValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNotesValue(notes || "");
    setIsEditing(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-white/90 font-medium flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-xl shadow-lg shadow-lime-400/30">
            <StickyNote className="h-5 w-5 text-black" />
          </div>
          Observações
        </Label>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-lime-400/20 to-yellow-300/20 hover:from-lime-400/30 hover:to-yellow-300/30 text-lime-300 border border-lime-400/40 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-lime-400/20"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <Textarea
            placeholder="Adicione suas observações sobre este lead..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="min-h-[120px] bg-white/15 backdrop-blur-sm border-lime-400/40 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30 rounded-xl resize-none"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-gradient-to-r from-lime-400/90 to-yellow-300/90 backdrop-blur-sm text-black font-semibold hover:from-lime-500/90 hover:to-yellow-400/90 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 transition-all duration-200 hover:scale-105"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-h-[100px]">
          {notes ? (
            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
              {notes}
            </p>
          ) : (
            <p className="text-white/50 italic">
              Nenhuma observação adicionada ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
