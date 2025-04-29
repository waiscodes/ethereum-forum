type RelevantLink = {
    url: string;
    title: string;
    internal: boolean;
    attachment: boolean;
    reflection: boolean;
    clicks: number;
};

export const spliceRelatedLinks = (links: RelevantLink[], predicate: (link: RelevantLink) => boolean, cap: number = Infinity) => {
    const newLinks = links.reduce((acc, link) => {
        if (acc[0].length < cap && predicate(link)) {
            acc[0].push(link);
        } else {
            acc[1].push(link);
        }

        return acc;
    }, [[], []] as [RelevantLink[], RelevantLink[]]);

    return newLinks;
};

export const isGithub = (link: string) => {
    if (!link) return false;

    const url = link.toLowerCase();

    return url.startsWith('https://github.com/');
};

export const isStandardsLink = (link: string) => {
    if (!link) return false;

    const url = link.toLowerCase();

    return !!['https://eips.ethereum.org/', 'https://ercs.ethereum.org/', 'https://github.com/ethereum/eips/', 'https://github.com/ethereum/ercs/'].find(domain => url.startsWith(domain));
};
