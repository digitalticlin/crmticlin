
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdvancedFilters } from '../useAdvancedFilters';

// Mock the queries module
vi.mock('../queries', () => ({
  useFilterOptions: () => ({
    data: {
      tags: [],
      funnelStages: [],
      responsibleUsers: []
    }
  })
}));

describe('useAdvancedFilters', () => {
  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    expect(result.current.filters.tags).toEqual([]);
    expect(result.current.filters.funnelStage).toBe('');
    expect(result.current.filters.funnelStages).toEqual([]);
    expect(result.current.filters.funnelIds).toEqual([]);
    expect(result.current.filters.dateRange).toEqual({ from: undefined, to: undefined });
    expect(result.current.filters.source).toBe('');
    expect(result.current.filters.value).toEqual({ min: undefined, max: undefined });
    expect(result.current.filters.companies).toEqual([]);
    expect(result.current.filters.responsibleUsers).toEqual([]);
    expect(result.current.filters.states).toEqual([]);
    expect(result.current.filters.cities).toEqual([]);
    expect(result.current.filters.countries).toEqual([]);
  });

  it('should add and remove tag filters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addTagFilter('tag1');
    });
    
    expect(result.current.filters.tags).toContain('tag1');
    
    act(() => {
      result.current.removeTagFilter('tag1');
    });
    
    expect(result.current.filters.tags).not.toContain('tag1');
  });

  it('should add and remove user filters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addUserFilter('user1');
    });
    
    expect(result.current.filters.responsibleUsers).toContain('user1');
    
    act(() => {
      result.current.removeUserFilter('user1');
    });
    
    expect(result.current.filters.responsibleUsers).not.toContain('user1');
  });

  it('should add and remove funnel filters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addFunnelFilter('funnel1');
    });
    
    expect(result.current.filters.funnelIds).toContain('funnel1');
    
    act(() => {
      result.current.removeFunnelFilter('funnel1');
    });
    
    expect(result.current.filters.funnelIds).not.toContain('funnel1');
  });

  it('should add and remove stage filters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addStageFilter('stage1');
    });
    
    expect(result.current.filters.funnelStages).toContain('stage1');
    
    act(() => {
      result.current.removeStageFilter('stage1');
    });
    
    expect(result.current.filters.funnelStages).not.toContain('stage1');
  });

  it('should update filters using updateFilters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.updateFilters({ 
        tags: ['tag1', 'tag2'],
        source: 'website'
      });
    });
    
    expect(result.current.filters.tags).toEqual(['tag1', 'tag2']);
    expect(result.current.filters.source).toBe('website');
  });

  it('should update individual filter using updateFilter', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.updateFilter('source', 'social');
    });
    
    expect(result.current.filters.source).toBe('social');
  });

  it('should reset all filters', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    // Add some filters first
    act(() => {
      result.current.updateFilters({ 
        tags: ['tag1'],
        source: 'website',
        companies: ['company1']
      });
    });
    
    // Reset filters
    act(() => {
      result.current.resetFilters();
    });
    
    expect(result.current.filters.tags).toEqual([]);
    expect(result.current.filters.source).toBe('');
    expect(result.current.filters.companies).toEqual([]);
  });

  it('should count active filters correctly', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    expect(result.current.activeFilterCount).toBe(0);
    
    act(() => {
      result.current.updateFilters({ 
        tags: ['tag1'],
        source: 'website'
      });
    });
    
    expect(result.current.activeFilterCount).toBe(2);
  });

  it('should build query filters correctly', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.updateFilters({ 
        tags: ['tag1', 'tag2'],
        source: 'website',
        value: { min: 100, max: 500 }
      });
    });
    
    const queryFilters = result.current.buildQueryFilters();
    
    expect(queryFilters.tags).toEqual(['tag1', 'tag2']);
    expect(queryFilters.source).toBe('website');
    expect(queryFilters.minValue).toBe(100);
    expect(queryFilters.maxValue).toBe(500);
  });
});
