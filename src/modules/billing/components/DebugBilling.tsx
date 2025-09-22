import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DebugBilling = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>🔧 Debug - Billing Module</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Se você está vendo esta mensagem, o módulo de billing está carregando corretamente.</p>
        <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm">✅ Componente renderizado com sucesso</p>
          <p className="text-sm">✅ Imports funcionando</p>
          <p className="text-sm">✅ Cards UI disponíveis</p>
        </div>
      </CardContent>
    </Card>
  );
};