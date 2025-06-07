import classNames from 'classnames';
import React from 'react';
import { LuFileText, LuMessageSquare, LuUser } from 'react-icons/lu';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match } from 'ts-pattern';

import { formatDate, truncateText } from '@/util/format';

import { PostCard } from './cards/PostCard';
import { SearchResults } from './components/SearchResults';
import type { ToolResultDisplayProps, UserProfile } from './types';

const UserProfileCard: React.FC<{ user: UserProfile }> = ({ user }) => (
    <div className="border border-primary/20 rounded-lg p-6 bg-secondary/50">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <LuUser size={24} className="text-primary/60" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-primary text-lg mb-1">@{user.username}</h3>
                {user.name && <p className="text-primary/80 text-sm mb-2">{user.name}</p>}
                {user.bio_raw && (
                    <p className="text-primary/70 text-sm leading-relaxed">
                        {truncateText(user.bio_raw, 150)}
                    </p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-primary/60">Posts:</span>
                    <span className="text-primary font-medium">{user.post_count}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-primary/60">Topics:</span>
                    <span className="text-primary font-medium">{user.topic_count}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-primary/60">Trust Level:</span>
                    <span className="text-primary font-medium">{user.trust_level}</span>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-primary/60">Likes Given:</span>
                    <span className="text-primary font-medium">{user.likes_given}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-primary/60">Likes Received:</span>
                    <span className="text-primary font-medium">{user.likes_received}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-primary/60">Joined:</span>
                    <span className="text-primary font-medium">{formatDate(user.created_at)}</span>
                </div>
            </div>
        </div>

        {user.location && (
            <div className="mt-4 pt-4 border-t border-primary/10">
                <div className="text-sm text-primary/60">📍 {user.location}</div>
            </div>
        )}
    </div>
);

const TopicSummaryDisplay: React.FC<{
    content: string;
    isExpanded: boolean;
    onExpand?: () => void;
}> = ({ content, isExpanded, onExpand }) => {
    const lines = content.split('\n');
    const previewLines = 5;
    const shouldTruncate = lines.length > previewLines;
    const displayContent =
        isExpanded || !shouldTruncate
            ? content
            : lines.slice(0, previewLines).join('\n') + (shouldTruncate ? '\n\n...' : '');

    return (
        <div
            className={classNames(
                'border border-primary/20 rounded-lg p-4 bg-secondary/50 space-y-3 transition-all duration-300',
                shouldTruncate &&
                    !isExpanded &&
                    'cursor-pointer hover:bg-secondary/70 hover:shadow-sm'
            )}
            onClick={shouldTruncate && !isExpanded && onExpand ? onExpand : undefined}
            title={shouldTruncate && !isExpanded ? 'Click to expand full summary' : undefined}
        >
            <div className="flex items-center gap-2">
                <LuFileText className="text-primary/60" size={16} />
                <h3 className="font-semibold text-primary">Topic Summary</h3>
                {shouldTruncate && !isExpanded && (
                    <span className="text-xs text-primary/60 bg-primary/10 px-2 py-1 rounded-full">
                        +{lines.length - previewLines} more lines
                    </span>
                )}
            </div>
            <div
                className={classNames(
                    'prose prose-sm max-w-none text-primary transition-all duration-300',
                    isExpanded || !shouldTruncate
                        ? 'max-h-96 overflow-y-auto'
                        : 'max-h-40 overflow-hidden'
                )}
            >
                <Markdown remarkPlugins={[remarkGfm]}>{displayContent}</Markdown>
            </div>
        </div>
    );
};

const PostsDisplay: React.FC<{ posts: any[]; isExpanded: boolean }> = ({ posts, isExpanded }) => {
    if (posts.length === 0) {
        return <div className="text-center py-4 text-primary/60">No posts found</div>;
    }

    // Transform API response to match our Post interface
    const transformedPosts = posts.map((apiPost: any) => ({
        id: apiPost.post_id,
        topic_id: apiPost.topic_id,
        post_number: apiPost.post_number,
        cooked: apiPost.cooked,
        created_at: apiPost.created_at,
        username: apiPost.extra?.username || 'Unknown User',
        name: apiPost.extra?.display_username || apiPost.extra?.name,
        avatar_template: apiPost.extra?.avatar_template,
        like_count: apiPost.extra?.actions_summary?.find((a: any) => a.id === 2)?.count,
        reply_count: apiPost.extra?.reply_count,
    }));

    const hasManyPosts = transformedPosts.length >= 4;
    const postsToShow =
        hasManyPosts && !isExpanded ? transformedPosts.slice(0, 3) : transformedPosts;

    return (
        <div className="space-y-3">
            <div className="text-sm font-semibold text-primary/80 flex items-center gap-2">
                <LuMessageSquare size={14} />
                <span>Posts ({transformedPosts.length})</span>
            </div>
            {isExpanded && (
                <div
                    className={classNames(
                        'space-y-3 transition-all duration-300',
                        isExpanded && hasManyPosts ? 'max-h-96 overflow-y-auto' : ''
                    )}
                >
                    {postsToShow.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};

const FallbackDisplay: React.FC<{ content: string; isExpanded: boolean }> = ({
    content,
    isExpanded,
}) => (
    <div
        className={classNames(
            'rounded-lg overflow-hidden transition-all duration-300 border bg-secondary border-primary/20',
            isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'
        )}
    >
        <pre className="text-xs p-3 font-mono whitespace-pre-wrap text-primary">{content}</pre>
    </div>
);

export const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({
    toolName,
    result,
    isExpanded,
    onExpand,
}) => {
    // Handle get_topic_summary (returns markdown, not JSON)
    if (toolName === 'get_topic_summary') {
        return <TopicSummaryDisplay content={result} isExpanded={isExpanded} onExpand={onExpand} />;
    }

    // For all other tools, try to parse as JSON
    try {
        const data = JSON.parse(result);

        return match(toolName)
            .with('get_posts', () => {
                const posts = Array.isArray(data) ? data : [];

                return <PostsDisplay posts={posts} isExpanded={isExpanded} />;
            })
            .with('search_forum', 'search_topics', 'search_posts', 'search_posts_in_topic', () => {
                return <SearchResults data={data} toolName={toolName} />;
            })
            .with('get_user_profile', 'get_user_summary', () => {
                return <UserProfileCard user={data as UserProfile} />;
            })
            .with('search_by_user', 'search_by_username', 'search_by_username_mention', () => {
                return <SearchResults data={data} toolName={toolName} />;
            })
            .with('username_to_user_id', () => {
                const userId = data as number;

                if (userId === -1) {
                    return <div className="text-center py-4 text-error">User not found</div>;
                }

                return (
                    <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                        <div className="text-success font-medium text-sm">User ID: {userId}</div>
                    </div>
                );
            })
            .otherwise(() => {
                return (
                    <FallbackDisplay
                        content={JSON.stringify(data, null, 2)}
                        isExpanded={isExpanded}
                    />
                );
            });
    } catch {
        // If JSON parsing fails, show raw text
        return <FallbackDisplay content={result} isExpanded={isExpanded} />;
    }
};
