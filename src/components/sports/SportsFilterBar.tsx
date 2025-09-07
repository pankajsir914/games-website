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
    <div className="space-y-3">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams, leagues, or matches..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-primary/20 focus:border-primary"
          />
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-1 overflow-x-auto pb-2 sm:pb-0">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(f.value as any)}
              className={cn(
                "transition-all flex-shrink-0",
                filter === f.value 
                  ? "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20" 
                  : "hover:border-primary/50"
              )}
            >
              <f.icon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{f.label}</span>
              <span className="sm:hidden text-xs">{f.label.slice(0, 3)}</span>
            </Button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && onViewModeChange(value as any)}
          className="justify-center sm:justify-end"
        >
          <ToggleGroupItem 
            value="grid" 
            aria-label="Grid view" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="list" 
            aria-label="List view" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};