
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, FileText, Save, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

interface DocumentSectionProps {
  client: ClientData;
}

export function DocumentSection({ client }: DocumentSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    document_type: client.document_type || "",
    document_id: client.document_id || ""
  });

  const handleSave = () => {
    // Here you can implement the update logic for document info
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#d3d800]" />
          <h3 className="text-lg font-semibold text-gray-900">Documento</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Tipo de Documento</Label>
          {isEditing ? (
            <Select 
              value={editedData.document_type} 
              onValueChange={(value) => setEditedData({...editedData, document_type: value})}
            >
              <SelectTrigger className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-gray-900">{client.document_type?.toUpperCase() || 'Não informado'}</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Número do Documento</Label>
          {isEditing ? (
            <Input
              value={editedData.document_id}
              onChange={(e) => setEditedData({...editedData, document_id: e.target.value})}
              className="mt-1 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
              placeholder="000.000.000-00"
            />
          ) : (
            <p className="text-gray-900">{client.document_id || 'Não informado'}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
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
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
