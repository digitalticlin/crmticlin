
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { useClientDeals, useCreateDeal, useDeleteDeal } from "@/hooks/clients/useClientDeals";
import { formatCurrency } from "@/lib/utils";

interface DealsHistorySectionProps {
  clientId: string;
}

export function DealsHistorySection({ clientId }: DealsHistorySectionProps) {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    status: "won" as "won" | "lost",
    value: "",
    note: ""
  });

  const { data: deals = [], isLoading } = useClientDeals(clientId);
  const createDealMutation = useCreateDeal(clientId);
  const deleteDealMutation = useDeleteDeal(clientId);

  const handleAddDeal = async () => {
    if (!newDeal.value) return;

    try {
      await createDealMutation.mutateAsync({
        status: newDeal.status,
        value: parseFloat(newDeal.value),
        note: newDeal.note || undefined
      });
      
      setNewDeal({ status: "won", value: "", note: "" });
      setIsAddDealOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar deal:", error);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await deleteDealMutation.mutateAsync(dealId);
    } catch (error) {
      console.error("Erro ao deletar deal:", error);
    }
  };

  const totalWon = deals.filter(d => d.status === "won").reduce((sum, d) => sum + d.value, 0);
  const totalLost = deals.filter(d => d.status === "lost").reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Negociações</h3>
          <p className="text-sm text-gray-600">{deals.length} negociações registradas</p>
        </div>
        
        <Dialog open={isAddDealOpen} onOpenChange={setIsAddDealOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#d3d800] hover:bg-[#b8c200] text-black">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Negociação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newDeal.status} 
                  onValueChange={(value: "won" | "lost") => setNewDeal({...newDeal, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">Ganho</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0.00"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="note">Observações</Label>
                <Textarea
                  id="note"
                  placeholder="Detalhes da negociação..."
                  value={newDeal.note}
                  onChange={(e) => setNewDeal({...newDeal, note: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddDeal}
                  disabled={!newDeal.value || createDealMutation.isPending}
                  className="bg-[#d3d800] hover:bg-[#b8c200] text-black flex-1"
                >
                  {createDealMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDealOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Total Ganho</span>
          </div>
          <p className="text-xl font-bold text-green-900">{formatCurrency(totalWon)}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Total Perdido</span>
          </div>
          <p className="text-xl font-bold text-red-900">{formatCurrency(totalLost)}</p>
        </div>
      </div>

      {/* Lista de Deals */}
      {deals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma negociação registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {deals.map((deal) => (
            <div 
              key={deal.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant={deal.status === "won" ? "default" : "destructive"}
                  className={deal.status === "won" 
                    ? "bg-green-100 text-green-800 hover:bg-green-200" 
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                  }
                >
                  {deal.status === "won" ? "Ganho" : "Perdido"}
                </Badge>
                
                <div>
                  <p className="font-medium text-gray-900">{formatCurrency(deal.value)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(deal.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                {deal.note && (
                  <p className="text-sm text-gray-600 max-w-xs truncate">
                    {deal.note}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteDeal(deal.id)}
                disabled={deleteDealMutation.isPending}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
