
import { useState, useRef, useEffect, useCallback } from "react";
import { ClientData } from "@/hooks/clients/types";
import { ClientsSearchBar } from "./ClientsSearchBar";
import { ClientsTable } from "./ClientsTable";

interface ClientsListTableProps {
  clients: ClientData[];
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreClients?: boolean;
  onLoadMoreClients?: () => Promise<void>;
  totalClientsCount?: number;
}

export const ClientsListTable = ({ 
  clients, 
  onSelectClient, 
  onEditClient, 
  onDeleteClient,
  isLoading,
  isLoadingMore = false,
  hasMoreClients = false,
  onLoadMoreClients,
  totalClientsCount = 0
}: ClientsListTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 🚀 SCROLL INFINITO: Detectar quando usuário chega próximo ao fim
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !onLoadMoreClients || isLoadingRef.current || !hasMoreClients) {
      return;
    }

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Carregar mais quando estiver a 200px do final
    const threshold = 200;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      console.log('[ClientsListTable] 📄 Trigger de carregamento ativado:', {
        distanceFromBottom,
        threshold,
        hasMore: hasMoreClients,
        isLoading: isLoadingRef.current
      });

      isLoadingRef.current = true;
      onLoadMoreClients().finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, [onLoadMoreClients, hasMoreClients]);

  // 🚀 ADICIONAR LISTENER DE SCROLL
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 🚀 INTERSECTION OBSERVER PARA BACKUP (quando scroll não funciona)
  useEffect(() => {
    if (!loadingTriggerRef.current || !onLoadMoreClients || !hasMoreClients) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingRef.current && hasMoreClients) {
          console.log('[ClientsListTable] 👁️ Intersection Observer ativado');
          isLoadingRef.current = true;
          onLoadMoreClients().finally(() => {
            isLoadingRef.current = false;
          });
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(loadingTriggerRef.current);
    return () => observer.disconnect();
  }, [onLoadMoreClients, hasMoreClients]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3d800]"></div>
          <p className="text-sm text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ClientsSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clients={clients}
        filteredClients={filteredClients}
        totalClientsCount={totalClientsCount}
        hasMoreClients={hasMoreClients}
      />

      <div 
        ref={scrollContainerRef}
        className="max-h-[600px] overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <ClientsTable
          filteredClients={filteredClients}
          searchQuery={searchQuery}
          onSelectClient={onSelectClient}
          onEditClient={onEditClient}
          onDeleteClient={onDeleteClient}
        />
        
        {/* 🚀 INDICADOR DE CARREGAMENTO */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#d3d800]"></div>
              <span className="text-sm text-gray-600">Carregando mais clientes...</span>
            </div>
          </div>
        )}
        
        {/* 🚀 TRIGGER INVISÍVEL PARA INTERSECTION OBSERVER */}
        {hasMoreClients && !isLoadingMore && (
          <div 
            ref={loadingTriggerRef}
            className="h-10 w-full"
            aria-hidden="true"
          />
        )}
        
        {/* 🚀 INDICADOR DE FIM DOS DADOS */}
        {!hasMoreClients && clients.length > 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">
              Todos os {totalClientsCount} clientes foram carregados
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
