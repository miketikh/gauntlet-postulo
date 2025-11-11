'use client';

/**
 * Template Search Component
 * Story 3.3: AC #5
 * Search box filters templates by name or description with debouncing
 */

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TemplateSearchProps {
  currentSearch: string;
  onChange: (search: string) => void;
}

export function TemplateSearch({ currentSearch, onChange }: TemplateSearchProps) {
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Sync with URL params
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  // Debounced search - AC #5: Search box filters templates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        onChange(searchValue);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchValue, currentSearch, onChange]);

  return (
    <div className="mb-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search templates by name or description..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
