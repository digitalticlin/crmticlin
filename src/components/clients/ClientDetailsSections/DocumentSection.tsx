
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, FileText, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface DocumentSectionProps {
  client: ClientData;
  onUpdateDocument: (data: { document_type: string; document_id: string }) => void;
}

export function DocumentSection({ client, onUpdateDocument }: DocumentSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    document_type: client.document_type || "",
    document_id: client.document_id || ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdateDocument(editedData);
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
          <FileText className="h-5 w-5 text-[#d3d800]" />
          <h3 className="text-lg font-semibold text-white">Documento</h3>
        </div>
        {!isEditing && (
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
      
      <div className="grid gap-4">
        <div>
          <Label className="text-sm font-medium text-white/90">Tipo de Documento</Label>
          {isEditing ? (
            <Select 
              value={editedData.document_type} 
              onValueChange={(value) => setEditedData({...editedData, document_type: value})}
            >
              <SelectTrigger className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-white/80">{client.document_type?.toUpperCase() || 'Não informado'}</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-white/90">Número do Documento</Label>
          {isEditing ? (
            <Input
              value={editedData.document_id}
              onChange={(e) => setEditedData({...editedData, document_id: e.target.value})}
              className="mt-1 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
              placeholder="000.000.000-00"
            />
          ) : (
            <p className="text-white/80">{client.document_id || 'Não informado'}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-white/20">
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
                setEditedData({
                  document_type: client.document_type || "",
                  document_id: client.document_id || ""
                });
              }}
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
