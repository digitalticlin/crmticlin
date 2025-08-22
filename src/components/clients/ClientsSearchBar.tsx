
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileSpreadsheet, Upload } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { toast } from "sonner";
import { ImportSpreadsheetModal } from "./import/ImportSpreadsheetModal";
import { AdvancedFiltersPopover } from "./filters/AdvancedFiltersPopover";

interface ClientsSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  clients: ClientData[];
  filteredClients: ClientData[];
  totalClientsCount?: number;
  hasMoreClients?: boolean;
}

export const ClientsSearchBar = ({ 
  searchQuery, 
  onSearchChange, 
  clients, 
  filteredClients,
  totalClientsCount = 0,
  hasMoreClients = false
}: ClientsSearchBarProps) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const exportToCSV = () => {
    // Create CSV header
    let csv = "Nome,Telefone,Email,Empresa,Valor de Compra,Notas\n";
    
    // Add data rows - usar filteredClients para export apenas do que está sendo exibido
    filteredClients.forEach(client => {
      const purchaseValue = client.purchase_value 
        ? `R$ ${client.purchase_value.toFixed(2).replace('.', ',')}`
        : '';
      
      csv += `"${client.name}","${client.phone}","${client.email || ''}","${client.company || ''}","${purchaseValue}","${client.notes || ''}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Lista de clientes exportada com sucesso");
  };

  // 🚀 TEXTO DE CONTAGEM INTELIGENTE
  const getCountText = () => {
    if (searchQuery.trim()) {
      return `${filteredClients.length} de ${clients.length} clientes`;
    } else {
      const loadedText = hasMoreClients 
        ? `${clients.length}+ clientes` 
        : `${clients.length} clientes`;
      
      return totalClientsCount > clients.length 
        ? `${clients.length} de ${totalClientsCount} clientes carregados`
        : loadedText;
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-xl">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 items-center flex-1 max-w-md">
          <Search className="w-4 h-4 text-black" />
          <Input
            placeholder="Buscar por nome, telefone, email ou empresa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-gray-800 placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-3">
          <AdvancedFiltersPopover />
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 rounded-xl bg-blue-600/20 backdrop-blur-sm border-blue-400/40 text-blue-800 hover:bg-blue-600/30 hover:text-blue-900"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border-white/40 text-gray-800 hover:bg-white/30 hover:text-gray-900"
            onClick={exportToCSV}
            disabled={filteredClients.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      <ImportSpreadsheetModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};
