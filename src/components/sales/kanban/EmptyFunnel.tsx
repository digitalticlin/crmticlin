
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyFunnel = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-gray-50 rounded-lg">
      <div className="text-6xl text-gray-300 mb-4">📊</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhum funil selecionado
      </h3>
      <p className="text-gray-600 mb-4 max-w-md">
        Selecione um funil para visualizar seus leads e etapas de vendas.
      </p>
      <Button variant="outline" className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Criar Novo Funil
      </Button>
    </div>
  );
};
