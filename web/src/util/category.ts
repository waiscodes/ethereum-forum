export const decodeCategory = (category: number): string[] => {
    switch (category) {
        case 67:
            return ['EIPs', 'EIPs Meta'];
        default:
            return [];
    }
};

