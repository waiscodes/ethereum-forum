import { useEffect, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { Link, useNavigate } from '@tanstack/react-router';
import { LuArrowRight } from 'react-icons/lu';

const navItems = [
  { value: 'Home', label: 'Home', keywords: ['home', 'main'], to: '/' },
  { value: 'Improvement Proposals', label: 'Improvement Proposals', keywords: ['eip', 'eips', 'improvement'], to: '/c/eips', short: 'EIPs' },
  { value: 'Request for Comment', label: 'Request for Comment', keywords: ['erc', 'ercs', 'comment'], to: '/c/ercs', short: 'ERCs' },
  { value: 'Working Groups', label: 'Working Groups', keywords: ['wg', 'wgs', 'working'], to: '/c/wgs' },
  { value: 'Protocol Agenda', label: 'Protocol Agenda', keywords: ['agenda', 'protocol'], to: '/c/agenda' },
];

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(navItems[0].value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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
      setSelected(navItems[0].value); // Auto-select top option
      setSearch('');
    }
  }, [open]);

  // Update selected when search changes and filtered list changes
  useEffect(() => {
    if (!open) return;
    const filtered = navItems.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())))
    );
    if (filtered.length > 0) {
      setSelected(filtered[0].value);
    }
  }, [search, open]);

  // Close on ESC and outside click
  useEffect(() => {
    if (!open) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function handleClick(e: MouseEvent) {
      if (
        overlayRef.current &&
        menuRef.current &&
        overlayRef.current.contains(e.target as Node) &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  const handleValueChange = (value: string) => {
    setSelected(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const item = navItems.find((i) => i.value === selected);
      
      if (item) {
        setOpen(false);
        navigate({ to: item.to });
      }
    }
  };

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
      <Command
        ref={menuRef}
        className="raycast w-full max-w-xl rounded-xl bg-primary shadow-2xl border border-primary p-0 overflow-hidden"
        value={selected}
        onValueChange={handleValueChange}
        loop
        label="Command Menu"
      >
        <div className="h-2 w-full bg-gradient-to-r from-accent/30 to-transparent" />
        <div className="relative w-full">
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 bg-primary text-primary placeholder:text-secondary border-b border-primary outline-none text-lg pr-40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const item = navItems.find((i) => i.value === selected);
                if (item) {
                  setOpen(false);
                  navigate({ to: item.to });
                }
              } else if (e.key === 'Tab') {
                e.preventDefault();
                setOpen(false);
                window.location.href = `/chat?search=${encodeURIComponent(search)}`;
              }
            }}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-accent text-primary rounded px-3 py-1 text-sm shadow hover:bg-accent-hover transition-colors"
            onClick={() => {
              setOpen(false);
              window.location.href = `/chat?search=${encodeURIComponent(search)}`;
            }}
            tabIndex={0}
          >
            Workshop Idea <span className="bg-secondary px-1 rounded text-xs ml-1">Tab</span>
          </button>
        </div>
        <hr className="border-primary" />
        <Command.List ref={listRef} className="max-h-72 overflow-y-auto">
          <Command.Group heading="Navigation" className="text-secondary px-4 pt-4 pb-1 text-xs">
            {navItems
              .filter((item) =>
                item.label.toLowerCase().includes(search.toLowerCase()) ||
                (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())))
              )
              .map((item) => (
                <Command.Item
                  key={item.value}
                  value={item.value}
                  keywords={item.keywords}
                  onSelect={() => {
                    setOpen(false);
                    navigate({ to: item.to });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-primary rounded cursor-pointer transition-colors w-full h-full ${selected === item.value ? 'bg-secondary' : ''} hover:bg-secondary`}
                >
                  <span className="flex-1 flex items-center gap-2 w-full h-full">
                    {item.label}
                    {item.short && (
                      <span className="ml-2 text-xs text-secondary">{item.short}</span>
                    )}
                  </span>
                  <span className="ml-auto text-xs text-secondary">
                    <LuArrowRight />
                  </span>
                </Command.Item>
              ))}
          </Command.Group>
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