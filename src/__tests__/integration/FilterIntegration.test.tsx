
import { render, screen } from '@testing-library/react';
import Clients from "@/pages/Clients"; // Corrigido import default
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Filter Integration Tests', () => {
  it('should render clients page', () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <Clients />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/clientes/i)).toBeInTheDocument();
  });
});
