
import { render, screen } from '@testing-library/react';
import Clients from '@/pages/Clients';

describe('Filter Integration Tests', () => {
  test('renders clients page', () => {
    render(<Clients />);
    expect(screen.getByText(/clients/i)).toBeInTheDocument();
  });
});
