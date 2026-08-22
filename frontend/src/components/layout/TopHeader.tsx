import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TopHeaderProps {
  title?: string;
  showSearch?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  showSearch = false,
}) => {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <SidebarTrigger />

      {title && (
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">
            {title}
          </h1>
        </div>
      )}

      {showSearch && (
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default TopHeader;

