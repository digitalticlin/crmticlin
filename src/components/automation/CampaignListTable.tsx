
import { useState } from "react";
import { CampaignsTable } from "./CampaignsTable";
import { CampaignSearchBar } from "./CampaignSearchBar";
import { CampaignDetails } from "./CampaignDetails";
import { useBroadcastCampaigns, BroadcastCampaign } from "@/hooks/broadcast/useBroadcastCampaigns";

export const CampaignListTable = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<BroadcastCampaign | null>(null);
  const { campaigns, loading, startCampaign } = useBroadcastCampaigns();

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCampaign = (campaign: BroadcastCampaign) => {
    setSelectedCampaign(campaign);
  };

  const handleStartCampaign = async (campaignId: string) => {
    await startCampaign(campaignId);
  };

  return (
    <div className="space-y-6">
      <CampaignSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <CampaignsTable
        filteredCampaigns={filteredCampaigns}
        searchQuery={searchQuery}
        onSelectCampaign={handleSelectCampaign}
        onStartCampaign={handleStartCampaign}
        loading={loading}
      />

      {selectedCampaign && (
        <CampaignDetails
          campaign={selectedCampaign}
          open={!!selectedCampaign}
          onOpenChange={(open) => !open && setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};
