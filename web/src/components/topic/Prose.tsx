// import 'prismjs/themes/prism.css';
import '../../styles/code.css';

import * as Prism from 'prismjs';

// This ensures prism is loaded first
// @ts-ignore
// eslint-disable-next-line
const data = Prism.util;

import 'prismjs/components/prism-solidity';
import 'prismjs/components/prism-go';

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

export const Prose: FC<{ content: string; topicId: number; postId: number }> = ({
    content,
    topicId,
    postId,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = ref.current;

        if (!container) return;

        // grab all links
        const anchors = Array.from(container.querySelectorAll('a'));
        // store handlers so we can clean up
        const handlers = anchors.map((a) => {
            const onClick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                (async () => {
                    await trackLinkClick(a.href, topicId, postId);

                    window.open(a.href, '_blank', 'noopener,noreferrer');
                })();
            };

            // TODO: Replace / ethmag links with https://ethereum-magicians.org/

            // force new-tab attrs
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            a.addEventListener('click', onClick);

            return { a, onClick };
        });

        const code = container.querySelectorAll('code');

        for (const c of code) {
            const langClass = [...c.classList.values()].find((l) => l.startsWith('language-'));
            const lang = langClass?.replace('language-', '');

            // console.log(lang);

            if (lang == 'auto') {
                // guess the lang and update it
                const content = c.textContent;

                // console.log('detecting lang ', content);

                if (['contract', 'uint256', 'address'].some((w) => content?.includes(w))) {
                    // console.log('detected solidity');
                    c.classList.add('language-solidity');
                    c.classList.remove('language-auto');
                }
            }

            if (lang == 'sol') {
                c.classList.add('language-solidity');
                c.classList.remove('language-sol');
            }

            if (lang == 'none') {
                continue;
            }

            Prism.highlightElement(c);
        }

        return () => {
            handlers.forEach(({ a, onClick }) => a.removeEventListener('click', onClick));
        };
    }, [content, ref]);

    return <div ref={ref} dangerouslySetInnerHTML={{ __html: content }} className="prose" />;
};
