import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { createContext, useContext } from 'react';

import { CommandDialog, CommandInput, CommandList } from './Command';
import { Navigation } from './groups/Navigation';
// import { Suggested } from './groups/Suggested';
import { UpcomingCalendarEvent } from './groups/Upcoming';
import { WorkshopIdea } from './groups/Workshop';

interface CommandContextType {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (item: { title: string; href: string; short?: string }) => void;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    handleSelect: (item: { title: string; href: string; short?: string }) => void;
    handleClose: () => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export function useCommand() {
    const ctx = useContext(CommandContext);

    if (!ctx) throw new Error('useCommand must be used within a CommandMenu');

    return ctx;
}

export const CommandMenu: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (item: { title: string; href: string; short?: string }) => void;
}> = ({ open, onOpenChange, onSelect }) => {
    const navigate = useNavigate();
    const [search, setSearch] = React.useState('');

    const handleSelect = (item: { title: string; href: string; short?: string }) => {
        if (onSelect) {
            onSelect(item);
        } else {
            navigate({ to: item.href });
        }

        handleClose();
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    const contextValue: CommandContextType = {
        open,
        onOpenChange,
        onSelect,
        search,
        setSearch,
        handleSelect,
        handleClose,
    };

    return (
        <CommandContext.Provider value={contextValue}>
            <CommandDialog open={open} onOpenChange={onOpenChange}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={search}
                    onValueChange={setSearch}
                />
                <CommandList>
                    <UpcomingCalendarEvent />
                    {/* <Suggested /> */}
                    <Navigation />
                    <WorkshopIdea />
                </CommandList>
            </CommandDialog>
        </CommandContext.Provider>
    );
};
