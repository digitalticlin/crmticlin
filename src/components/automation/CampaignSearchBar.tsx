
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CampaignSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CampaignSearchBar = ({ searchQuery, onSearchChange }: CampaignSearchBarProps) => {
  return (
    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl p-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar campanhas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/50 border-white/20 backdrop-blur-sm"
        />
      </div>
    </div>
  );
};
