export const decodeCategory = (category: number): string[] => {
    switch (category) {
        case 1:
            return ['Uncategorized'];
        case 5:
            return ['EIPs'];
        case 6:
            return ['Magicians', 'Process Improvement'];
        case 8:
            return ['Protocol Calls', 'Announcements'];
        case 9:
            return ['Magicians', 'Primordial Soup'];
        case 67:
            return ['EIPs', 'EIPs Meta'];
        case 35:
            return ['EIPs', 'Core'];
        case 63:
            return ['Protocol Calls'];
        default:
            return [];
    }
};

