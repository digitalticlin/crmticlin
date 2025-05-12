import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { AddColumnDialog } from "@/components/sales/AddColumnDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft, Tag, Plus, Phone } from "lucide-react";
import { toast } from "sonner";
import { FIXED_COLUMN_IDS, KanbanLead } from "@/types/kanban";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function SalesFunnel() {
  const [activeTab, setActiveTab] = useState("funnel");
  
  const {
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
  } = useSalesFunnel();

  const handleOpenChat = (lead: any) => {
    // In a real application, this would navigate to the chat page with this contact
    toast.info(`Abrindo chat com ${lead.name}...`, {
      description: "Essa funcionalidade conectará com o WhatsApp em breve."
    });
  };

  // Function to move a lead to the won or lost column
  const moveLeadToStatus = (lead: KanbanLead, status: "won" | "lost") => {
    const targetColumnId = status === "won" ? FIXED_COLUMN_IDS.WON : FIXED_COLUMN_IDS.LOST;
    
    // Find and remove the lead from its current column
    const updatedColumns = columns.map(col => ({
      ...col,
      leads: col.leads.filter(l => l.id !== lead.id)
    }));
    
    // Add the lead to the target column
    const finalColumns = updatedColumns.map(col => {
      if (col.id === targetColumnId) {
        return {
          ...col,
          leads: [lead, ...col.leads]
        };
      }
      return col;
    });
    
    setColumns(finalColumns);
    
    toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
  };

  const handleManageTags = () => {
    toast.info("Gerenciamento de etiquetas em desenvolvimento");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Funil de Vendas</h1>
              <p className="text-gray-400">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            
            <div className="flex gap-2">
              {activeTab === "won-lost" ? (
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("funnel")}
                  className="bg-black/40 border-gray-600/30 text-white hover:bg-black/60"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar ao Funil
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-black/40 border-gray-600/30 text-white hover:bg-black/60"
                    onClick={handleManageTags}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Gerenciar Etiquetas
                  </Button>
                  <Button 
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lead
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs for switching between funnel and won/lost leads */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-black/40 border border-gray-600/30">
              <TabsTrigger value="funnel" className="data-[state=active]:bg-ticlin data-[state=active]:text-black">
                Funil Principal
              </TabsTrigger>
              <TabsTrigger value="won-lost" className="data-[state=active]:bg-ticlin data-[state=active]:text-black">
                Ganhos e Perdidos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Kanban Board with conditional rendering based on active tab */}
          {activeTab === "funnel" && (
            <KanbanBoard 
              columns={columns}
              onColumnsChange={setColumns}
              onOpenLeadDetail={openLeadDetail}
              onColumnUpdate={updateColumn}
              onColumnDelete={deleteColumn}
              onOpenChat={handleOpenChat}
              onMoveToWonLost={moveLeadToStatus}
            />
          )}

          {activeTab === "won-lost" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Won Leads */}
              <Card className="bg-black/30 backdrop-blur-lg border-gray-600/30 shadow-xl">
                <CardHeader className="border-b border-gray-600/30">
                  <CardTitle className="text-xl font-medium text-green-500">Leads Ganhos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {columns.find(col => col.id === FIXED_COLUMN_IDS.WON)?.leads.length ? (
                    <div className="grid grid-cols-1 gap-3">
                      {columns.find(col => col.id === FIXED_COLUMN_IDS.WON)?.leads.map(lead => (
                        <div 
                          key={lead.id} 
                          className="bg-black/40 backdrop-blur-lg p-3 rounded-lg border border-gray-600/30 cursor-pointer"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white">{lead.name}</h3>
                            <span className="text-sm font-semibold text-green-400">R$ {Math.floor(Math.random() * 50000)}</span>
                          </div>
                          <div className="flex items-center text-gray-400 mt-1 mb-2">
                            <Phone className="h-3 w-3 mr-1" />
                            <span className="text-xs">{lead.phone || "(11) 98765-4321"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag.id} className={cn("text-black text-xs", tag.color)}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(lead);
                              }}
                              className="text-white hover:bg-gray-700"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Nenhum lead ganho no momento.</p>
                  )}
                </CardContent>
              </Card>

              {/* Lost Leads */}
              <Card className="bg-black/30 backdrop-blur-lg border-gray-600/30 shadow-xl">
                <CardHeader className="border-b border-gray-600/30">
                  <CardTitle className="text-xl font-medium text-red-500">Leads Perdidos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {columns.find(col => col.id === FIXED_COLUMN_IDS.LOST)?.leads.length ? (
                    <div className="grid grid-cols-1 gap-3">
                      {columns.find(col => col.id === FIXED_COLUMN_IDS.LOST)?.leads.map(lead => (
                        <div 
                          key={lead.id} 
                          className="bg-black/40 backdrop-blur-lg p-3 rounded-lg border border-gray-600/30 cursor-pointer"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white">{lead.name}</h3>
                            <span className="text-sm font-semibold text-red-400">R$ {Math.floor(Math.random() * 50000)}</span>
                          </div>
                          <div className="flex items-center text-gray-400 mt-1 mb-2">
                            <Phone className="h-3 w-3 mr-1" />
                            <span className="text-xs">{lead.phone || "(11) 98765-4321"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag.id} className={cn("text-black text-xs", tag.color)}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(lead);
                              }}
                              className="text-white hover:bg-gray-700"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Nenhum lead perdido no momento.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* Lead Detail Sidebar */}
      <LeadDetailSidebar 
        isOpen={isLeadDetailOpen}
        onOpenChange={setIsLeadDetailOpen}
        selectedLead={selectedLead}
        availableTags={availableTags}
        onToggleTag={toggleTagOnLead}
        onUpdateNotes={updateLeadNotes}
        onCreateTag={createTag}
      />
    </div>
  );
}
