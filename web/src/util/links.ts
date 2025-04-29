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

    return link.startsWith('https://github.com/');
};
