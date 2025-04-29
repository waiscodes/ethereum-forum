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
