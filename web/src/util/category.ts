export const decodeCategory = (category: number): string[] => {
    switch (category) {
        case 1:
            return ['Uncategorized'];
        case 5:
            return ['EIPs'];
        case 35:
            return ['EIPs', 'Core'];
        case 45:
            return ['EIPs', 'EIPs Interfaces'];
        case 64:
            return ['EIPs', 'EIPs Networking'];
        case 66:
            return ['EIPs', 'EIPs Informational'];
        case 67:
            return ['EIPs', 'EIPs Meta'];
        case 6:
            return ['Magicians', 'Process Improvement'];
        case 8:
            return ['Protocol Calls', 'Announcements'];
        case 9:
            return ['Magicians', 'Primordial Soup'];
        case 63:
            return ['Protocol Calls'];
        default:
            return [];
    }
};

// Generate a deterministic hex color from a string input
const stringToColor = (str: string): string => {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hex = (hash & 0x00ffffff).toString(16).padStart(6, '0');

    return `#${hex}`;
};

export const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'Uncategorized':
            return '#00F0FF';
        case 'EIPs':
            return '#0000FF';
        case 'Magicians':
            return '#FF00FF';
        case 'Primordial Soup':
            return '#9d0ccf';
        case 'evm':
            return '#5c9213';
        case 'wallet':
            return '#00FF00';
        case 'risc-v':
            return '#eb92a6';
        case 'cairo':
            return '#88531a';
        case 'evm risc-v':
            return '#0000FF';
        default:
            return stringToColor(category);
    }
};
