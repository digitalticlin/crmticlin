import React, { useMemo } from "react";
import { 
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { ClientData } from "@/hooks/clients/types";
import { ClientsSearchBar } from "./ClientsSearchBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  onServerSearch?: (query: string) => void;
}

export function ClientsListTable({
  clients,
  onSelectClient,
  onEditClient,
  onDeleteClient,
  isLoading,
  isLoadingMore,
  hasMoreClients,
  onLoadMoreClients,
  totalClientsCount,
  onServerSearch
}: ClientsListTableProps) {
  
  const columns: ColumnDef<ClientData>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefone",
        cell: ({ row }) => <div>{row.getValue("phone")}</div>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
      },
      {
        accessorKey: "company",
        header: "Empresa",
        cell: ({ row }) => <div>{row.getValue("company") || "-"}</div>,
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return (
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(date), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectClient(row.original)}
            >
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditClient(row.original)}
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteClient(row.original.id)}
            >
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    [onSelectClient, onEditClient, onDeleteClient]
  );

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ClientsSearchBar
        searchTerm=""
        onSearchChange={onServerSearch || (() => {})}
        clients={clients}
        filteredClients={clients}
        totalClientsCount={totalClientsCount || 0}
        hasMoreClients={hasMoreClients || false}
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasMoreClients && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMoreClients}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
