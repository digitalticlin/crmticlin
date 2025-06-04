
interface EmptyContactsStateProps {
  searchQuery: string;
  activeFilter: string;
}

export const EmptyContactsState = ({ searchQuery, activeFilter }: EmptyContactsStateProps) => {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
        <div className="h-8 w-8 text-gray-500">💬</div>
      </div>
      <p className="text-gray-600 text-lg font-medium">
        {searchQuery || activeFilter !== "all" 
          ? 'Nenhuma conversa encontrada' 
          : 'Nenhuma conversa ainda'}
      </p>
      {!searchQuery && activeFilter === "all" && (
        <p className="text-gray-500 text-sm mt-2">
          As conversas aparecerão aqui quando você receber mensagens
        </p>
      )}
    </div>
  );
};
