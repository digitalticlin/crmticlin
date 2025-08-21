
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";
import { CampaignTableRow } from "./CampaignTableRow";

interface CampaignsTableProps {
  filteredCampaigns: BroadcastCampaign[];
  searchQuery: string;
  onSelectCampaign: (campaign: BroadcastCampaign) => void;
  onStartCampaign: (campaignId: string) => void;
  loading: boolean;
}

export const CampaignsTable = ({ 
  filteredCampaigns, 
  searchQuery, 
  onSelectCampaign, 
  onStartCampaign,
  loading 
}: CampaignsTableProps) => {
  if (loading) {
    return (
      <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/30 bg-white/20">
            <TableHead className="font-semibold text-gray-900">Campanha</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Público</TableHead>
            <TableHead className="font-semibold text-gray-900">Progresso</TableHead>
            <TableHead className="font-semibold text-gray-900">Criado em</TableHead>
            <TableHead className="w-24 font-semibold text-gray-900">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCampaigns.map(campaign => (
            <CampaignTableRow
              key={campaign.id}
              campaign={campaign}
              onSelectCampaign={onSelectCampaign}
              onStartCampaign={onStartCampaign}
            />
          ))}
          {filteredCampaigns.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Nenhuma campanha encontrada</p>
                    <p className="text-sm text-gray-600">
                      {searchQuery 
                        ? "Tente ajustar sua pesquisa ou adicione uma nova campanha" 
                        : "Crie sua primeira campanha para começar"}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
