import { Link } from '@tanstack/react-router';
import classNames from 'classnames';
import React from 'react';
import {
    LuCalendar,
    LuExternalLink,
    LuFileText,
    LuHash,
    LuMessageSquare,
    LuSearch,
    LuUser,
    LuUsers,
} from 'react-icons/lu';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match } from 'ts-pattern';

interface ToolResultDisplayProps {
    toolName: string;
    result: string;
    isExpanded: boolean;
}

// Type definitions for the API responses
interface TopicSummary {
    id: number;
    title: string;
    posts_count: number;
    created_at: string;
    last_posted_at: string;
    views: number;
    like_count: number;
    participants?: Array<{ id: number; username: string; avatar_template?: string }>;
}

interface Post {
    id: number;
    topic_id: number;
    post_number: number;
    raw?: string;
    cooked: string;
    created_at: string;
    username: string;
    name?: string;
    avatar_template?: string;
    like_count?: number;
    reply_count?: number;
}

// Actual API response format for search results
interface SearchEntity {
    entity_type: 'topic' | 'post';
    topic_id: number | null;
    post_id: number | null;
    post_number: number | null;
    user_id: number | null;
    username: string | null;
    title: string | null;
    slug: string | null;
    pm_issue: number | null;
    cooked: string | null;
    entity_id: string;
}

interface SearchResult {
    topics?: TopicSummary[];
    posts?: Post[];
    hits?: number;
}

interface UserProfile {
    id: number;
    username: string;
    name?: string;
    avatar_template?: string;
    bio_raw?: string;
    location?: string;
    website_name?: string;
    created_at: string;
    last_posted_at?: string;
    last_seen_at?: string;
    post_count: number;
    topic_count: number;
    likes_given: number;
    likes_received: number;
    trust_level: number;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';

    if (diffDays === 1) return '1 day ago';

    if (diffDays < 30) return `${diffDays} days ago`;

    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return `${Math.floor(diffDays / 365)} years ago`;
};

const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;

    return text.slice(0, maxLength) + '...';
};

const TopicCard: React.FC<{ topic: TopicSummary; showDetails?: boolean }> = ({
    topic,
    showDetails = true,
}) => (
    <div className="border border-primary/20 rounded-lg p-4 bg-secondary/50 hover:bg-secondary/70 transition-colors">
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-primary text-sm leading-tight mb-2 line-clamp-2">
                    {topic.title}
                </h3>
                {showDetails && (
                    <div className="flex items-center gap-4 text-xs text-primary/60">
                        <div className="flex items-center gap-1">
                            <LuMessageSquare size={12} />
                            <span>{topic.posts_count} posts</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <LuCalendar size={12} />
                            <span>{formatRelativeTime(topic.created_at)}</span>
                        </div>
                        {topic.views && (
                            <div className="flex items-center gap-1">
                                <span>{topic.views} views</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <a
                href={`#/topic/${topic.id}`}
                className="text-primary/60 hover:text-primary transition-colors flex-shrink-0"
                title="View topic"
            >
                <LuExternalLink size={16} />
            </a>
        </div>
        {topic.participants && topic.participants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary/10">
                <div className="flex items-center gap-2 text-xs text-primary/60">
                    <LuUsers size={12} />
                    <span>Participants:</span>
                    <div className="flex items-center gap-1">
                        {topic.participants.slice(0, 3).map((participant) => (
                            <span key={participant.id} className="text-primary">
                                @{participant.username}
                            </span>
                        ))}
                        {topic.participants.length > 3 && (
                            <span className="text-primary/50">
                                +{topic.participants.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
);

const PostCard: React.FC<{ post: Post; showDetails?: boolean }> = ({
    post,
    showDetails = true,
}) => {
    // Extract plain text from HTML content
    const getPlainText = (html: string) => {
        const tempDiv = document.createElement('div');

        tempDiv.innerHTML = html;

        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const plainText = getPlainText(post.cooked);

    return (
        <div className="border border-primary/20 rounded-lg p-4 bg-secondary/50 hover:bg-secondary/70 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <LuUser size={14} className="text-primary/60" />
                    <span className="font-medium text-primary text-sm">@{post.username}</span>
                    {post.name && <span className="text-primary/60 text-xs">({post.name})</span>}
                </div>
                <div className="flex items-center gap-2">
                    {showDetails && (
                        <span className="text-xs text-primary/60">#{post.post_number}</span>
                    )}
                    <a
                        href={`#/topic/${post.topic_id}/${post.post_number}`}
                        className="text-primary/60 hover:text-primary transition-colors"
                        title="View post"
                    >
                        <LuExternalLink size={14} />
                    </a>
                </div>
            </div>

            <div className="text-sm text-primary/80 leading-relaxed mb-3">
                {truncateText(plainText, showDetails ? 300 : 150)}
            </div>

            {showDetails && (
                <div className="flex items-center gap-4 text-xs text-primary/60">
                    <div className="flex items-center gap-1">
                        <LuCalendar size={12} />
                        <span>{formatRelativeTime(post.created_at)}</span>
                    </div>
                    {post.like_count && post.like_count > 0 && (
                        <div className="flex items-center gap-1">
                            <span>❤️ {post.like_count}</span>
                        </div>
                    )}
                    {post.reply_count && post.reply_count > 0 && (
                        <div className="flex items-center gap-1">
                            <span>💬 {post.reply_count}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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

// Cards for search entity results (different format from structured data)
const SearchTopicCard: React.FC<{ entity: SearchEntity }> = ({ entity }) => (
    <div className="border border-primary/20 rounded-lg p-4 bg-secondary/50 hover:bg-secondary/70 transition-colors">
        <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-primary text-sm leading-tight mb-2 line-clamp-2">
                    {entity.title || 'Untitled Topic'}
                </h3>
                <div className="flex items-center gap-4 text-xs text-primary/60">
                    <div className="flex items-center gap-1">
                        <LuHash size={12} />
                        <span>{entity.topic_id}</span>
                    </div>
                    {entity.pm_issue && (
                        <div className="flex items-center gap-1">
                            <span>PM Issue #{entity.pm_issue}</span>
                        </div>
                    )}
                </div>
            </div>
            <Link
                to="/t/$topicId"
                params={{ topicId: entity.topic_id?.toString() ?? '' }}
                className="text-primary/60 hover:text-primary transition-colors flex-shrink-0"
                title="View topic"
            >
                <LuExternalLink size={16} />
            </Link>
        </div>
    </div>
);

const SearchPostCard: React.FC<{ entity: SearchEntity }> = ({ entity }) => (
    <div className="border border-primary/20 rounded-lg p-4 bg-secondary/50 hover:bg-secondary/70 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
                <LuUser size={14} className="text-primary/60" />
                <span className="font-medium text-primary text-sm">
                    @{entity.username || 'Unknown User'}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-primary/60">#{entity.post_number}</span>
                <a
                    href={`#/topic/${entity.topic_id}/${entity.post_number}`}
                    className="text-primary/60 hover:text-primary transition-colors"
                    title="View post"
                >
                    <LuExternalLink size={14} />
                </a>
            </div>
        </div>

        {entity.cooked && (
            <div className="text-sm text-primary/80 leading-relaxed mb-3">
                {truncateText(entity.cooked.replace(/<[^>]*>/g, ''), 200)}
            </div>
        )}

        <div className="flex items-center gap-4 text-xs text-primary/60">
            <div className="flex items-center gap-1">
                <LuMessageSquare size={12} />
                <span>Topic #{entity.topic_id}</span>
            </div>
        </div>
    </div>
);

// Component to handle the raw search entity format from the API
const SearchEntityResultsDisplay: React.FC<{ entities: SearchEntity[]; toolName: string }> = ({
    entities,
    toolName,
}) => {
    // Separate topics and posts
    const topics = entities.filter((entity) => entity.entity_type === 'topic');
    const posts = entities.filter((entity) => entity.entity_type === 'post');
    const totalHits = entities.length;

    return (
        <div className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <LuSearch className="text-success" size={16} />
                <span className="text-success font-medium text-sm">
                    {match(toolName)
                        .with(
                            'search_topics',
                            () => `${topics.length} topic${topics.length !== 1 ? 's' : ''} found`
                        )
                        .with(
                            'search_posts',
                            () => `${posts.length} post${posts.length !== 1 ? 's' : ''} found`
                        )
                        .with(
                            'search_forum',
                            () => `${totalHits} result${totalHits !== 1 ? 's' : ''} found`
                        )
                        .otherwise(() => `${totalHits} result${totalHits !== 1 ? 's' : ''} found`)}
                </span>
            </div>

            {/* Topics */}
            {topics.length > 0 && (
                <div>
                    {topics.length > 1 && (
                        <h4 className="text-sm font-semibold text-primary/80 mb-3 flex items-center gap-2">
                            <LuHash size={14} />
                            Topics ({topics.length})
                        </h4>
                    )}
                    <div className="space-y-3">
                        {topics.map((entity) => (
                            <SearchTopicCard key={entity.entity_id} entity={entity} />
                        ))}
                    </div>
                </div>
            )}

            {/* Posts */}
            {posts.length > 0 && (
                <div>
                    {posts.length > 1 && (
                        <h4 className="text-sm font-semibold text-primary/80 mb-3 flex items-center gap-2">
                            <LuMessageSquare size={14} />
                            Posts ({posts.length})
                        </h4>
                    )}
                    <div className="space-y-3">
                        {posts.map((entity) => (
                            <SearchPostCard key={entity.entity_id} entity={entity} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SearchResultsDisplay: React.FC<{ data: SearchResult; toolName: string }> = ({
    data,
    toolName,
}) => {
    const topicCount = data.topics?.length || 0;
    const postCount = data.posts?.length || 0;
    const totalHits = data.hits || topicCount + postCount;

    return (
        <div className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <LuSearch className="text-success" size={16} />
                <span className="text-success font-medium text-sm">
                    {match(toolName)
                        .with(
                            'search_topics',
                            () => `${topicCount} topic${topicCount !== 1 ? 's' : ''} found`
                        )
                        .with(
                            'search_posts',
                            () => `${postCount} post${postCount !== 1 ? 's' : ''} found`
                        )
                        .with(
                            'search_forum',
                            () => `${totalHits} result${totalHits !== 1 ? 's' : ''} found`
                        )
                        .otherwise(() => `${totalHits} result${totalHits !== 1 ? 's' : ''} found`)}
                </span>
            </div>

            {/* Topics */}
            {data.topics && data.topics.length > 0 && (
                <div>
                    {data.topics.length > 1 && (
                        <h4 className="text-sm font-semibold text-primary/80 mb-3 flex items-center gap-2">
                            <LuHash size={14} />
                            Topics ({data.topics.length})
                        </h4>
                    )}
                    <div className="space-y-3">
                        {data.topics.map((topic) => (
                            <TopicCard key={topic.id} topic={topic} />
                        ))}
                    </div>
                </div>
            )}

            {/* Posts */}
            {data.posts && data.posts.length > 0 && (
                <div>
                    {data.posts.length > 1 && (
                        <h4 className="text-sm font-semibold text-primary/80 mb-3 flex items-center gap-2">
                            <LuMessageSquare size={14} />
                            Posts ({data.posts.length})
                        </h4>
                    )}
                    <div className="space-y-3">
                        {data.posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({
    toolName,
    result,
    isExpanded,
}) => {
    // Handle get_topic_summary first since it returns raw markdown, not JSON
    if (toolName === 'get_topic_summary') {
        // Split the markdown into lines for truncation
        const lines = result.split('\n');
        const previewLines = 5; // Show first 5 lines by default
        const shouldTruncate = lines.length > previewLines;
        const displayContent =
            isExpanded || !shouldTruncate
                ? result
                : lines.slice(0, previewLines).join('\n') + (shouldTruncate ? '\n\n...' : '');

        return (
            <div className="border border-primary/20 rounded-lg p-4 bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
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
    }

    // For all other tools, try to parse as JSON
    try {
        const data = JSON.parse(result);

        return match(toolName)
            .with('get_posts', () => {
                // Handle direct array response from get_posts API
                const posts = Array.isArray(data) ? data : [];

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

                return (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-primary/80 mb-3 flex items-center gap-2">
                            <LuMessageSquare size={14} />
                            Posts ({transformedPosts.length})
                        </div>
                        {transformedPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                );
            })
            .with('search_forum', 'search_topics', 'search_posts', 'search_posts_in_topic', () => {
                // Check if data is an array of search entities (new format) or structured data (old format)
                if (Array.isArray(data)) {
                    return <SearchEntityResultsDisplay entities={data} toolName={toolName} />;
                }

                return <SearchResultsDisplay data={data} toolName={toolName} />;
            })
            .with('get_user_profile', 'get_user_summary', () => {
                const user = data as UserProfile;

                return <UserProfileCard user={user} />;
            })
            .with('search_by_user', 'search_by_username', 'search_by_username_mention', () => {
                return <SearchResultsDisplay data={data} toolName={toolName} />;
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
                // Fallback to JSON display for unknown tools
                return (
                    <div
                        className={classNames(
                            'rounded-lg overflow-hidden transition-all duration-300 border bg-secondary border-primary/20',
                            isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'
                        )}
                    >
                        <pre className="text-xs p-3 font-mono whitespace-pre-wrap text-primary">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                );
            });
    } catch {
        // If JSON parsing fails, show raw text
        return (
            <div
                className={classNames(
                    'rounded-lg overflow-hidden transition-all duration-300 border bg-secondary border-primary/20',
                    isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'
                )}
            >
                <pre className="text-xs p-3 font-mono whitespace-pre-wrap text-primary">
                    {result}
                </pre>
            </div>
        );
    }
};
