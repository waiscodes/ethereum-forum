import * as React from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from './Command';
import { useNavigate } from '@tanstack/react-router';

// Navigation items from Sidebar
const navItems = [
  { title: 'Index', href: '/' },
  { title: 'Improvement Proposals', short: 'EIPs', href: '/c/eips' },
  { title: 'Request for Comment', short: 'ERCs', href: '/c/ercs' },
  { title: 'Working Groups', href: '/c/wgs' },
  { title: 'Protocol Agenda', href: '/c/agenda' },
];

// Suggested items (dummy for now)
const suggestedItems = [
  { title: 'Trending Topics', href: '/trending' },
  { title: 'Recent Discussions', href: '/recent' },
];

// Dummy category
const dummyItems = [
  { title: 'Dummy Action 1', href: '/dummy1' },
  { title: 'Dummy Action 2', href: '/dummy2' },
];

export const CommandMenu: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item: { title: string; href: string; short?: string }) => void;
}> = ({ open, onOpenChange, onSelect }) => {
  const navigate = useNavigate();

  // Helper to handle selection
  const handleSelect = (item: { title: string; href: string; short?: string }) => {
    if (onSelect) {
      onSelect(item);
    } else {
      navigate({ to: item.href });
    }
    onOpenChange(false); // Close menu after selection
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggested">
          {suggestedItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => handleSelect(item)}>
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => handleSelect(item)}>
              {item.title}
              {item.short && (
                <span className="ml-2 text-xs text-muted-foreground">{item.short}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Dummy Category">
          {dummyItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => handleSelect(item)}>
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
