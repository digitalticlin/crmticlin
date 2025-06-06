
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Save, X, User, Phone } from "lucide-react";

interface GlassmorphismLeadHeaderProps {
  selectedLead: KanbanLead;
  onUpdateName?: (name: string) => void;
  onClose: () => void;
}

export const GlassmorphismLeadHeader = ({
  selectedLead,
  onUpdateName,
  onClose
}: GlassmorphismLeadHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(selectedLead.name);

  const handleSave = () => {
    onUpdateName?.(name);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(selectedLead.name);
    setIsEditing(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-lime-400/30 via-yellow-300/20 to-lime-500/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-lime-400/40 shadow-2xl shadow-lime-400/20">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl"></div>
      
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-lime-400/60 backdrop-blur-sm shadow-xl shadow-lime-400/30">
            <AvatarImage src={selectedLead.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-lime-400/80 to-yellow-300/80 text-black font-bold text-lg">
              {selectedLead.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/20 backdrop-blur-sm border-lime-400/50 text-white placeholder:text-white/60 focus:border-lime-400 focus:ring-lime-400/30"
                  placeholder="Nome do lead"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-lime-400/90 to-yellow-300/90 backdrop-blur-sm text-black font-semibold hover:from-lime-500/90 hover:to-yellow-400/90 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 transition-all duration-200"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg transition-all duration-200"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white drop-shadow-2xl mb-1">
                  {selectedLead.name}
                </h2>
                <div className="flex items-center gap-2 text-lime-200/90">
                  <Phone className="h-4 w-4 text-lime-400" />
                  <span className="text-sm font-medium">{selectedLead.phone}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onUpdateName && !isEditing && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsEditing(true)}
              className="bg-lime-400/20 hover:bg-lime-400/30 text-lime-300 border border-lime-400/40 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-lime-400/20"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status indicators */}
      <div className="relative flex gap-2">
        <div className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 border border-lime-400/30">
          <span className="text-xs text-lime-300 font-medium flex items-center gap-1">
            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
            Online
          </span>
        </div>
        
        {selectedLead.unreadCount && selectedLead.unreadCount > 0 && (
          <div className="bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-sm rounded-full px-3 py-1 border border-red-400/50 shadow-lg shadow-red-400/30">
            <span className="text-xs text-white font-bold">
              {selectedLead.unreadCount} não lida{selectedLead.unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
