import { useNavigate } from '@tanstack/react-router';
import { GrWorkshop } from 'react-icons/gr';

import { CommandItem } from '../Command';
import { useCommand } from '../CommandMenu';

export const WorkshopIdea = () => {
    const { search, onOpenChange } = useCommand();
    const navigate = useNavigate();

    if (!search || search.length < 2) return null;

    return (
        <CommandItem
            value={`Workshop idea: ${search} `}
            keywords={['workshop idea', 'workshop', 'idea', 'ai', 'chat', ' ']}
            onSelect={() => {
                navigate({
                    to: '/chat/$chatId',
                    params: { chatId: 'new' },
                    search: { q: search },
                });
                onOpenChange(false);
            }}
            className="flex flex-col items-start gap-1 px-4 py-3"
        >
            <div className="flex items-center gap-2 my-2">
                <GrWorkshop className="size-5" />
                <span className="font-semibold">Open in Workshop</span>
            </div>
            <div className="text-base text-primary/80 pl-7 break-words w-full text-left">
                {search}
            </div>
        </CommandItem>
    );
};
