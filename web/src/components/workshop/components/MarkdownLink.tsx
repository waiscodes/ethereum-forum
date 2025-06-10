import { Link } from '@tanstack/react-router';
import React from 'react';

import { TopicPreviewTooltip } from './TopicPreviewTooltip';
import { UserProfileTooltip } from './UserProfileTooltip';

// Custom Link Component for Markdown
// TODO: fix this component to support any discourse
export const MarkdownLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { href, children, ...otherProps } = props;

    if (!href) {
        return <span {...otherProps}>{children}</span>;
    }

    // Check if it's an internal link (starts with /)
    const isInternalLink = href.startsWith('/');

    if (isInternalLink) {
        // Check if it's a user profile link (/u/username)
        const userMatch = href.match(/^\/u\/([^/]+)$/);
        // Check if it's a topic link (/t/topic-id or /t/slug/topic-id)
        const topicMatch = href.match(/^\/t\/(?:[^/]+\/)?(\d+)(?:\/\d+)?$/);

        if (userMatch) {
            const [, username] = userMatch;

            return (
                <UserProfileTooltip username={username}>
                    <Link
                        to="/u/$userId"
                        params={{ userId: username }}
                        className="text-blue-600 hover:text-blue-800 underline"
                        {...otherProps}
                    >
                        {children}
                    </Link>
                </UserProfileTooltip>
            );
        }

        if (topicMatch) {
            const [, topicId] = topicMatch;

            return (
                <TopicPreviewTooltip topicId={topicId}>
                    <Link
                        to="/t/$discourseId/$topicId"
                        // TODO support any discourse
                        params={{ discourseId: 'magicians', topicId }}
                        className="text-blue-600 hover:text-blue-800 underline"
                        {...otherProps}
                    >
                        {children}
                    </Link>
                </TopicPreviewTooltip>
            );
        }

        // For other internal links, use tanstack Link
        return (
            <Link
                to={href as any}
                className="text-blue-600 hover:text-blue-800 underline"
                {...otherProps}
            >
                {children}
            </Link>
        );
    }

    // For external links, use regular anchor tag
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            {...otherProps}
        >
            {children}
        </a>
    );
};
