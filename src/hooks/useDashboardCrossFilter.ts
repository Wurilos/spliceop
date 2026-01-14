import { useState, useCallback, useMemo } from 'react';

export interface CrossFilter {
  field: string;
  value: string | number | null;
  label?: string;
}

export interface UseDashboardCrossFilterReturn {
  activeFilter: CrossFilter | null;
  setFilter: (field: string, value: string | number | null, label?: string) => void;
  clearFilter: () => void;
  isFiltered: (field: string, value: string | number) => boolean;
  filterData: <T>(data: T[], field: keyof T) => T[];
  getFilterStyles: (field: string, value: string | number) => {
    cursor: string;
    opacity: number;
    transform: string;
    transition: string;
  };
}

export function useDashboardCrossFilter(): UseDashboardCrossFilterReturn {
  const [activeFilter, setActiveFilter] = useState<CrossFilter | null>(null);

  const setFilter = useCallback((field: string, value: string | number | null, label?: string) => {
    setActiveFilter((prev) => {
      // Toggle off if clicking the same filter
      if (prev?.field === field && prev?.value === value) {
        return null;
      }
      return { field, value, label };
    });
  }, []);

  const clearFilter = useCallback(() => {
    setActiveFilter(null);
  }, []);

  const isFiltered = useCallback(
    (field: string, value: string | number): boolean => {
      if (!activeFilter) return false;
      return activeFilter.field === field && activeFilter.value === value;
    },
    [activeFilter]
  );

  const filterData = useCallback(
    <T,>(data: T[], field: keyof T): T[] => {
      if (!activeFilter) return data;
      if (activeFilter.field !== String(field)) return data;
      return data.filter((item) => item[field] === activeFilter.value);
    },
    [activeFilter]
  );

  const getFilterStyles = useCallback(
    (field: string, value: string | number) => {
      const isActive = isFiltered(field, value);
      const hasFilter = activeFilter !== null;
      const isMatchingField = activeFilter?.field === field;

      return {
        cursor: 'pointer',
        opacity: hasFilter && isMatchingField && !isActive ? 0.4 : 1,
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease-in-out',
      };
    },
    [activeFilter, isFiltered]
  );

  return {
    activeFilter,
    setFilter,
    clearFilter,
    isFiltered,
    filterData,
    getFilterStyles,
  };
}
