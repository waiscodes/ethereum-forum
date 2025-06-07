import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from './Command';

// Navigation items from Sidebar
const navItems = [
    { title: 'Index', href: '/', short: 'Everything' },
    { title: 'Roadmap', href: '/r', short: 'Hardforks' },
    { title: 'Standards', href: '/s', short: 'EIPs & ERCs' },
    { title: 'Protocol Agenda', href: '/c', short: 'Calendar' },
    { title: 'Workshop', href: '/chat/new' },
];

// Suggested items (dummy for now)
const suggestedItems = [
    { title: 'Trending Topics', href: '/trending' },
    { title: 'Recent Discussions', href: '/recent' },
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
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {item.short}
                                </span>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
