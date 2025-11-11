'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export function ProjectsFilters({
  currentStatus,
  currentSearch,
  onChange,
}: {
  currentStatus: string;
  currentSearch: string;
  onChange: (filters: { status?: string; search?: string }) => void;
}) {
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (search !== currentSearch) {
        onChange({ search });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, currentSearch, onChange]);

  return (
    <div className="flex gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search projects by title or client name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select
        value={currentStatus || 'all'}
        onValueChange={(value) => onChange({ status: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="in_review">In Review</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
