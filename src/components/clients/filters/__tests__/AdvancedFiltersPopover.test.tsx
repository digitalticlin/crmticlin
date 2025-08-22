
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdvancedFiltersPopover } from '../AdvancedFiltersPopover';

const mockProps = {
  onFiltersChange: vi.fn(),
  currentFilters: {}
};

describe('AdvancedFiltersPopover', () => {
  it('should render the filter trigger button', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should open popover when trigger is clicked', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
  });

  it('should close popover when close button is clicked', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();
  });

  it('should apply filters when apply button is clicked', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);
    expect(mockProps.onFiltersChange).toHaveBeenCalled();
  });

  it('should clear all filters when clear button is clicked', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({});
  });

  it('should show active filter count when filters are applied', () => {
    const filtersWithData = { name: 'test', status: 'active' };
    render(<AdvancedFiltersPopover {...mockProps} currentFilters={filtersWithData} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should update filter when input value changes', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    const nameInput = screen.getByPlaceholderText(/filter by name/i);
    fireEvent.change(nameInput, { target: { value: 'John' } });
    expect(nameInput).toHaveValue('John');
  });

  it('should reset filters to initial state when cancel is clicked', () => {
    render(<AdvancedFiltersPopover {...mockProps} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    const nameInput = screen.getByPlaceholderText(/filter by name/i);
    fireEvent.change(nameInput, { target: { value: 'John' } });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(nameInput).toHaveValue('');
  });
});
