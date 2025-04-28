import { FC, useEffect, useRef } from 'react';

const trackLinkClick = async (url: string, topicId: number, postId: number) => {
    const formData = new FormData();

    formData.append('url', url);
    formData.append('post_id', postId.toString());
    formData.append('topic_id', topicId.toString());

    await fetch('https://ethereum-magicians.org/clicks/track', {
        body: formData,
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
    });
};

export const Prose: FC<{ content: string, topicId: number, postId: number }> = ({ content, topicId, postId }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = ref.current;

        if (!container) return;

        // grab all links
        const anchors = Array.from(container.querySelectorAll('a'));
        // store handlers so we can clean up
        const handlers = anchors.map(a => {
            const onClick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Link clicked:', a.href);

                (async () => {
                    await trackLinkClick(a.href, topicId, postId);

                    window.open(a.href, '_blank', 'noopener,noreferrer');
                })();

            };

            // force new-tab attrs
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            a.addEventListener('click', onClick);

            return { a, onClick };
        });

        return () => {
            handlers.forEach(({ a, onClick }) =>
                a.removeEventListener('click', onClick)
            );
        };
    }, [content]);

    return (
        <div ref={ref} dangerouslySetInnerHTML={{ __html: content }} className="prose" />
    );
};
