
import React from 'react';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WonLostFunnel = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-gradient-to-br from-green-50 to-red-50 rounded-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
          <Trophy className="w-8 h-8 text-green-600" />
        </div>
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
          <X className="w-8 h-8 text-red-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Leads Finalizados
      </h3>
      <p className="text-gray-600 mb-4 max-w-md">
        Visualize aqui os leads que foram ganhos ou perdidos no seu funil de vendas.
      </p>
      <Button variant="outline">
        Ver Relatório Completo
      </Button>
    </div>
  );
};
