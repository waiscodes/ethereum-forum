import classNames from 'classnames';
import { formatDistanceToNow } from 'date-fns';
import { FC } from 'react';
import { FiHeart, FiLink } from 'react-icons/fi';

import { Post } from '@/api/topics';

export const TopicPost: FC<{ post: Post }> = ({ post }) => {
    const extra = post.extra as Record<string, unknown>;
    const displayName = (extra?.['display_username'] || extra?.['name'] || extra?.['username']) as string;
    const username = extra?.['username'] as string;
    const avatar = extra?.['avatar_template'] as string;
    const actions_summary = extra?.['actions_summary'] as { id: number, count: number }[] || [];
    // like count is action id 2 (my guess)
    const likes = actions_summary.find((action) => action.id === 2)?.count || 0;
    const post_url = post.post_url ?? '';
    const hidden = extra?.['hidden'] as boolean;

    return (
        <div key={post.post_id} className={classNames('space-y-2', hidden && 'opacity-50')}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {avatar &&
                        <img src={'https://ethereum-magicians.org' + avatar.replace('{size}', '40')} alt={username} className="w-7 h-7 rounded-sm" />
                    }
                    <div className="leading-3">
                        <div className="font-bold">{displayName ?? post.user_id}</div>
                        {
                            username.toLowerCase().replace(' ', '') !== displayName.toLowerCase().replace(' ', '') && (
                                <div className="text-sm text-gray-500">@{username}</div>
                            )
                        }
                    </div>
                </div>
                <div className="text-end font-bold text-sm">
                    {post.updated_at ? formatDistanceToNow(post.updated_at) : ''} ago
                </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: post.cooked ?? '' }} className="prose" />
            <div className="flex items-center gap-2 justify-end">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                    <div className="flex items-center gap-1">
                        <FiHeart /> {likes}
                    </div>
                    {
                        post_url && (
                            <a href={'https://ethereum-magicians.org' + post_url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 flex items-center gap-1 hover:bg-secondary p-1">
                                <FiLink />
                            </a>
                        )
                    }
                </div>
            </div>
        </div>
    );
};
