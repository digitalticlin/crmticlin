
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Clients = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Gerencie seus clientes aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Página de clientes em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
