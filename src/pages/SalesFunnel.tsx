
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { AddColumnDialog } from "@/components/sales/AddColumnDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-muted-foreground">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            
            <div className="flex gap-2">
              {activeTab === "won" || activeTab === "lost" ? (
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("funnel")}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar ao Funil
                </Button>
              ) : (
                <AddColumnDialog onAddColumn={addColumn} />
              )}
            </div>
          </div>
          
          {/* Tabs for switching between funnel, won and lost leads */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="funnel">Funil Principal</TabsTrigger>
              <TabsTrigger value="won">Leads Ganhos</TabsTrigger>
              <TabsTrigger value="lost">Leads Perdidos</TabsTrigger>
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
            />
          )}

          {activeTab === "won" && (
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg border border-green-200 p-4">
              <h2 className="text-xl font-medium mb-4 text-green-600">Leads Ganhos</h2>
              {columns.find(col => col.id === "column-won")?.leads.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {columns.find(col => col.id === "column-won")?.leads.map(lead => (
                    <div 
                      key={lead.id} 
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => openLeadDetail(lead)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{lead.name}</h3>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(lead);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{lead.lastMessage}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum lead ganho no momento.</p>
              )}
            </div>
          )}

          {activeTab === "lost" && (
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg border border-red-200 p-4">
              <h2 className="text-xl font-medium mb-4 text-red-600">Leads Perdidos</h2>
              {columns.find(col => col.id === "column-lost")?.leads.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {columns.find(col => col.id === "column-lost")?.leads.map(lead => (
                    <div 
                      key={lead.id} 
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => openLeadDetail(lead)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{lead.name}</h3>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(lead);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{lead.lastMessage}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum lead perdido no momento.</p>
              )}
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
