import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Filter, Grid, List, Activity, Calendar, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SportsFilterBarProps {
  filter: 'all' | 'live' | 'today' | 'upcoming';
  onFilterChange: (filter: 'all' | 'live' | 'today' | 'upcoming') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const SportsFilterBar: React.FC<SportsFilterBarProps> = ({
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
}) => {
  const filters = [
    { value: 'all', label: 'All', icon: Trophy },
    { value: 'live', label: 'Live', icon: Activity },
    { value: 'today', label: 'Today', icon: Calendar },
    { value: 'upcoming', label: 'Upcoming', icon: Clock },
  ];

  return (
    <div className="space-y-2">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams, leagues, or matches..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-primary/20 focus:border-primary h-9 text-sm"
          />
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex items-center gap-2">
        {/* Filter Buttons */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(f.value as any)}
              className={cn(
                "transition-all flex-shrink-0 h-8 px-2 sm:px-3",
                filter === f.value 
                  ? "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20" 
                  : "hover:border-primary/50"
              )}
            >
              <f.icon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="text-xs sm:text-sm">{f.label}</span>
            </Button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && onViewModeChange(value as any)}
          className="flex-shrink-0"
        >
          <ToggleGroupItem 
            value="grid" 
            aria-label="Grid view" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 w-8"
          >
            <Grid className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="list" 
            aria-label="List view" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 w-8"
          >
            <List className="h-3 w-3" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};