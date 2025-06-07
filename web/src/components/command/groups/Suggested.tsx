import { CommandGroup, CommandItem, CommandSeparator } from '../Command';
import { useCommand } from '../CommandMenu';

const suggestedItems = [
    { title: 'View Summary', href: '/trending' },
    { title: 'Recent Discussions', href: '/recent' },
];

export const Suggested = () => {
    const { handleSelect } = useCommand();

    return (
        <>
            <CommandGroup heading="Suggested">
                {suggestedItems.map((item) => (
                    <CommandItem key={item.href} onSelect={() => handleSelect(item)}>
                        {item.title}
                    </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
        </>
    );
};
