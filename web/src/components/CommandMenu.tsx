import { useEffect, useRef, useState } from 'react';
import { Command } from 'cmdk';

const menuItems = [
  {
    group: 'Suggestions',
    items: [
      { value: 'Home', label: 'Home', keywords: ['home', 'main'], onSelect: () => alert('Home selected') },
      { value: 'Profile', label: 'Profile', keywords: ['profile', 'user'], onSelect: () => alert('Profile selected') },
      { value: 'Settings', label: 'Settings', keywords: ['settings', 'preferences'], onSelect: () => alert('Settings selected') },
    ],
  },
  {
    group: 'General',
    items: [
      { value: 'Home', label: 'Home', keywords: ['home', 'main'], onSelect: () => alert('Home selected') },
      { value: 'Profile', label: 'Profile', keywords: ['profile', 'user'], onSelect: () => alert('Profile selected') },
      { value: 'Settings', label: 'Settings', keywords: ['settings', 'preferences'], onSelect: () => alert('Settings selected') },
    ],
  },
];

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
      <Command className="raycast w-full max-w-xl rounded-xl bg-primary shadow-2xl border border-primary p-0 overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-accent/30 to-transparent" />
        <Command.Input
          ref={inputRef}
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command or search..."
          className="w-full px-4 py-3 bg-primary text-primary placeholder:text-secondary border-b border-primary outline-none text-lg"
          autoFocus
        />
        <hr className="border-primary" />
        <Command.List ref={listRef} className="max-h-72 overflow-y-auto">
          <Command.Empty className="text-secondary px-4 py-2">No results found.</Command.Empty>
          {menuItems.map((group) => (
            <Command.Group key={group.group} heading={group.group} className="text-secondary px-4 pt-4 pb-1 text-xs">
              {group.items.map((item) => (
                <Command.Item
                  key={item.value}
                  value={item.value}
                  keywords={item.keywords}
                  onSelect={item.onSelect}
                  className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-secondary rounded cursor-pointer transition-colors"
                >
                  {item.label}
                  <span className="ml-auto text-xs text-secondary">Application</span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
        <div className="flex items-center justify-between px-4 py-2 bg-secondary border-t border-primary text-secondary text-xs">
          <span>Press <kbd className="bg-secondary px-1 rounded">⌘</kbd> <kbd className="bg-secondary px-1 rounded">K</kbd> to toggle</span>
          <button
            className="ml-auto flex items-center gap-1 px-2 py-1 bg-accent text-primary rounded hover:bg-accent-hover transition-colors text-xs"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      </Command>
    </div>
  );
} 