
export const AIAgentCardSkeleton = () => {
  return (
    <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg p-4 space-y-3 animate-pulse">
      {/* Header: Nome e Ícone */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-11 w-11 rounded-xl bg-gray-200/50"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200/50 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200/50 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-6 w-11 bg-gray-200/50 rounded-full"></div>
      </div>

      {/* Badge */}
      <div className="h-6 bg-gray-200/50 rounded w-24"></div>

      {/* Mensagens */}
      <div className="bg-gradient-to-br from-gray-100/50 to-gray-50/50 rounded-lg p-3 border border-gray-200/30">
        <div className="h-8 bg-gray-200/50 rounded w-20 mx-auto"></div>
        <div className="h-3 bg-gray-200/50 rounded w-32 mx-auto mt-2"></div>
      </div>

      {/* Configuração */}
      <div className="space-y-2 bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-200/50"></div>
          <div className="h-3 bg-gray-200/50 rounded w-32"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-200/50"></div>
          <div className="h-3 bg-gray-200/50 rounded w-36"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-200/50"></div>
          <div className="h-3 bg-gray-200/50 rounded w-28"></div>
        </div>
      </div>

      {/* Data */}
      <div className="h-3 bg-gray-200/50 rounded w-40"></div>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/30">
        <div className="flex-1 h-9 bg-gray-200/50 rounded"></div>
        <div className="h-9 w-9 bg-gray-200/50 rounded"></div>
      </div>
    </div>
  );
};
