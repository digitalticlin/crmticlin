import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFunnel } from "@/hooks/useFunnel";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface AdvancedFiltersPopoverProps {
  onApplyFilters: (filters: any) => void;
  onClearFilters: () => void;
}

export const AdvancedFiltersPopover = ({ onApplyFilters, onClearFilters }: AdvancedFiltersPopoverProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const { toast } = useToast();

  const { data: teamMembersData, isLoading: isLoadingTeamMembers } = useTeamMembers();
  const { data: funnelsData, isLoading: isLoadingFunnels } = useFunnel();

  const handleApplyFilters = () => {
    const filters = {
      name,
      email,
      phone,
      dateFrom,
      dateTo,
      teamMembers: selectedTeamMembers,
      funnels: selectedFunnels,
      includeArchived,
    };
    onApplyFilters(filters);
    toast({
      title: "Filtros aplicados com sucesso!",
    });
  };

  const handleClearFilters = () => {
    setName("");
    setEmail("");
    setPhone("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedTeamMembers([]);
    setSelectedFunnels([]);
    setIncludeArchived(false);
    onClearFilters();
    toast({
      title: "Filtros removidos com sucesso!",
    });
  };

  const handleTeamMemberSelect = (teamMemberId: string) => {
    setSelectedTeamMembers((prevSelected) =>
      prevSelected.includes(teamMemberId)
        ? prevSelected.filter((id) => id !== teamMemberId)
        : [...prevSelected, teamMemberId]
    );
  };

  const handleFunnelSelect = (funnelId: string) => {
    setSelectedFunnels((prevSelected) =>
      prevSelected.includes(funnelId)
        ? prevSelected.filter((id) => id !== funnelId)
        : [...prevSelected, funnelId]
    );
  };

  const teamMembers = Array.isArray(teamMembersData) 
  ? teamMembersData.filter((member): member is { id: string; name: string } => 
      typeof member === 'object' && member !== null && 'id' in member && 'name' in member
    )
  : [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filtros Avançados</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
          </div>
          <div className="space-y-2">
            <Label>Data de Criação</Label>
            <div className="flex space-x-2">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                className="rounded-md border"
              />
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                className="rounded-md border"
              />
            </div>
          </div>
          <div>
            <Label>Membros do Time</Label>
            <div className="flex flex-col space-y-1">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-member-${member.id}`}
                    checked={selectedTeamMembers.includes(member.id)}
                    onCheckedChange={() => handleTeamMemberSelect(member.id)}
                  />
                  <Label htmlFor={`team-member-${member.id}`}>{member.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Funis</Label>
            <div className="flex flex-col space-y-1">
              {funnelsData?.map((funnel) => (
                <div key={funnel.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`funnel-${funnel.id}`}
                    checked={selectedFunnels.includes(funnel.id)}
                    onCheckedChange={() => handleFunnelSelect(funnel.id)}
                  />
                  <Label htmlFor={`funnel-${funnel.id}`}>{funnel.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-archived"
              checked={includeArchived}
              onCheckedChange={() => setIncludeArchived((prev) => !prev)}
            />
            <Label htmlFor="include-archived">Incluir Arquivados</Label>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            Limpar
          </Button>
          <Button size="sm" onClick={handleApplyFilters}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
