import '../../styles/code.css';

import { Link } from '@tanstack/react-router';
import classNames from 'classnames';
import React from 'react';
import {
    LuBrain,
    LuChevronLeft,
    LuChevronRight,
    LuCog,
    LuCopy,
    LuLoader,
    LuPencil,
    LuUser,
} from 'react-icons/lu';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match } from 'ts-pattern';

import { components } from '@/api/schema.gen';
import { useTopic } from '@/api/topics';
import { useUser } from '@/api/user';
import { useWorkshopStreamMessage, WorkshopMessage } from '@/api/workshop';
import { Tooltip } from '@/components/tooltip/Tooltip';

import { ToolCallDisplay } from './ToolCallDisplay';

// User Profile Tooltip Component
const UserProfileTooltip = ({
    username,
    children,
}: {
    username: string;
    children: React.ReactNode;
}) => {
    const { data: user, isLoading, error } = useUser(username);

    const tooltipContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 p-2">
                    <LuLoader className="animate-spin" size={16} />
                    <span>Loading...</span>
                </div>
            );
        }

        if (error || !user) {
            return (
                <div className="flex items-center gap-2 p-2 text-red-500">
                    <LuUser size={16} />
                    <span>User not found</span>
                </div>
            );
        }

        const avatarUrl = user.user.avatar_template?.replace('{size}', '40') || '';
        const fullAvatarUrl = avatarUrl.startsWith('http')
            ? avatarUrl
            : `https://ethereum-magicians.org${avatarUrl}`;

        return (
            <div className="p-3 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                    {user.user.avatar_template && (
                        <img
                            src={fullAvatarUrl}
                            alt={`${user.user.username}'s avatar`}
                            className="w-10 h-10 rounded-full"
                        />
                    )}
                    <div>
                        <div className="font-semibold">{user.user.name || user.user.username}</div>
                        <div className="text-sm text-gray-500">@{user.user.username}</div>
                    </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                    {user.user.title && (
                        <div className="font-medium text-blue-600">{user.user.title}</div>
                    )}
                    <div>Trust Level: {user.user.trust_level}</div>
                    {user.user.badge_count && user.user.badge_count > 0 && (
                        <div>
                            {user.user.badge_count} badge{user.user.badge_count !== 1 ? 's' : ''}
                        </div>
                    )}
                    {user.user.last_seen_at && (
                        <div>
                            Last seen: {new Date(user.user.last_seen_at).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return <Tooltip trigger={<span>{children}</span>}>{tooltipContent()}</Tooltip>;
};

// Topic Preview Tooltip Component
const TopicPreviewTooltip = ({
    topicId,
    children,
}: {
    topicId: string;
    children: React.ReactNode;
}) => {
    const { data: topic, isLoading, error } = useTopic(topicId);

    const tooltipContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 p-2">
                    <LuLoader className="animate-spin" size={16} />
                    <span>Loading...</span>
                </div>
            );
        }

        if (error || !topic) {
            return (
                <div className="flex items-center gap-2 p-2 text-red-500">
                    <LuCog size={16} />
                    <span>Topic not found</span>
                </div>
            );
        }

        return (
            <div className="p-3 max-w-sm">
                <div className="mb-2">
                    <div className="font-semibold text-sm line-clamp-2">{topic.title}</div>
                    <div className="text-xs text-gray-500 mt-1">#{topic.topic_id}</div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex gap-4">
                        <span>
                            {topic.post_count} post{topic.post_count !== 1 ? 's' : ''}
                        </span>
                        <span>
                            {topic.view_count} view{topic.view_count !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {topic.like_count > 0 && (
                        <div>
                            {topic.like_count} like{topic.like_count !== 1 ? 's' : ''}
                        </div>
                    )}

                    <div className="flex gap-4 text-xs">
                        <span>Created: {new Date(topic.created_at).toLocaleDateString()}</span>
                        {topic.last_post_at && (
                            <span>
                                Last post: {new Date(topic.last_post_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {topic.pm_issue && (
                        <div className="text-blue-600 font-medium">PM Issue #{topic.pm_issue}</div>
                    )}
                </div>
            </div>
        );
    };

    return <Tooltip trigger={<span>{children}</span>}>{tooltipContent()}</Tooltip>;
};

// Custom Link Component for Markdown
const MarkdownLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
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
                        to="/t/$topicId"
                        params={{ topicId }}
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

// Custom markdown components
const markdownComponents = {
    a: MarkdownLink,
};

// Streaming Events Types (temporary until schema is regenerated)
interface StreamingEvent {
    content: string;
    type: 'content' | 'tool_call_start' | 'tool_call_result' | 'tool_call_error';
    tool_call?: {
        tool_name: string;
        tool_id: string;
        arguments?: string;
        result?: string;
        status: 'starting' | 'executing' | 'success' | 'error';
    };
}

// Component to display stored streaming events using the same logic as live streaming
const StoredStreamingEvents = ({ events }: { events: StreamingEvent[] }) => {
    // Convert stored events to StreamingResponse format to reuse existing logic
    const streamingResponses: components['schemas']['StreamingResponse'][] = events.map(
        (event) => ({
            content: event.content,
            is_complete: false,
            error: undefined,
            entry_type: event.type as any,
            tool_call: event.tool_call
                ? {
                      tool_name: event.tool_call.tool_name,
                      tool_id: event.tool_call.tool_id,
                      arguments: event.tool_call.arguments || undefined,
                      result: event.tool_call.result || undefined,
                      status: event.tool_call.status as any,
                  }
                : undefined,
        })
    );

    // Use the same tool call processing logic as the streaming API
    const toolCalls = React.useMemo(() => {
        const calls = new Map<string, components['schemas']['ToolCallEntry']>();

        streamingResponses.forEach((response) => {
            if (response.tool_call && response.entry_type !== 'Content') {
                calls.set(response.tool_call.tool_id, response.tool_call);
            }
        });

        return Array.from(calls.values());
    }, [streamingResponses]);

    if (toolCalls.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 px-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-primary shadow-sm">
                    <LuCog size={14} />
                </div>
                <h3 className="text-sm font-semibold text-primary">Tool Executions</h3>
                <div className="flex-1 h-px bg-primary/20"></div>
                <span className="text-xs text-primary/70 bg-secondary px-2 py-1 rounded-full border border-primary/20">
                    {toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-3">
                {toolCalls.map((toolCall) => (
                    <ToolCallDisplay key={toolCall.tool_id} toolCall={toolCall} />
                ))}
            </div>
        </div>
    );
};

// Helper function to safely convert unknown streaming_events to typed version
const convertToExtendedMessage = (message: WorkshopMessage): ExtendedWorkshopMessage => {
    const { streaming_events, ...rest } = message;
    let typedStreamingEvents: StreamingEvent[] | undefined;

    // Type guard for streaming events
    if (streaming_events && Array.isArray(streaming_events)) {
        typedStreamingEvents = streaming_events.filter(
            (event: any) =>
                event && typeof event.content === 'string' && typeof event.type === 'string'
        ) as StreamingEvent[];
    }

    return {
        ...rest,
        streaming_events: typedStreamingEvents,
    };
};

// Extended WorkshopMessage type that includes streaming_events
interface ExtendedWorkshopMessage extends Omit<WorkshopMessage, 'streaming_events'> {
    streaming_events?: StreamingEvent[];
}

export interface MessageTreeNode {
    message: ExtendedWorkshopMessage;
    children: MessageTreeNode[];
    siblings: ExtendedWorkshopMessage[];
    currentSiblingIndex: number;
}

export interface ChatMessageProps {
    node?: MessageTreeNode;
    message?: ExtendedWorkshopMessage;
    onEdit?: (message: ExtendedWorkshopMessage) => void;
    onNavigate?: (message: ExtendedWorkshopMessage) => void;
}

export const ChatMessage = ({ node, message, onEdit, onNavigate }: ChatMessageProps) => {
    // Support both old and new interfaces
    const messageData = node?.message || convertToExtendedMessage(message!);
    const siblings = node?.siblings || [];
    const currentSiblingIndex = node?.currentSiblingIndex || 0;
    const hasPrevSibling = currentSiblingIndex > 0;
    const hasNextSibling = currentSiblingIndex < siblings.length - 1;

    const handlePrevSibling = () => {
        if (hasPrevSibling && onNavigate) {
            onNavigate(siblings[currentSiblingIndex - 1]);
        }
    };

    const handleNextSibling = () => {
        if (hasNextSibling && onNavigate) {
            onNavigate(siblings[currentSiblingIndex + 1]);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(messageData);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(messageData.message);
    };

    return (
        <div
            className={classNames(
                'flex flex-col gap-2 scroll-m-20',
                messageData.sender_role === 'user' && 'ml-auto w-fit',
                messageData.sender_role === 'assistant' && ''
            )}
            key={messageData.message_id}
            id={messageData.message_id}
        >
            {match(messageData.sender_role)
                .with('user', () => <div className="text-sm text-primary/50">You</div>)
                .with('assistant', () => <div className="text-sm text-primary/50">Assistant</div>)
                .otherwise(() => null)}

            <div
                key={messageData.message_id}
                // className="border p-4 border-primary/50 rounded-md pr-6"
            >
                {/* Show stored streaming events if they exist */}
                {messageData.streaming_events && messageData.streaming_events.length > 0 && (
                    <StoredStreamingEvents events={messageData.streaming_events} />
                )}
                <div
                    className={classNames(
                        'prose',
                        messageData.sender_role === 'user' && 'card border border-primary/50'
                    )}
                >
                    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {messageData.message}
                    </Markdown>
                </div>
                {messageData.message.length === 0 && (
                    <ChatDataStream
                        chatId={messageData.chat_id}
                        messageId={messageData.message_id}
                    />
                )}
            </div>

            {/* Branch navigation and actions */}
            <div className="text-sm text-primary/50 flex justify-end gap-2 items-center">
                {/* Branch navigation arrows - only show if using tree interface */}
                {node && siblings.length > 1 && (
                    <>
                        <button
                            className={classNames(
                                'button aspect-square size-8 flex justify-center items-center',
                                !hasPrevSibling && 'opacity-30 cursor-not-allowed'
                            )}
                            onClick={handlePrevSibling}
                            disabled={!hasPrevSibling}
                            title="Previous branch"
                        >
                            <LuChevronLeft />
                        </button>
                        <span className="text-xs px-1">
                            {currentSiblingIndex + 1}/{siblings.length}
                        </span>
                        <button
                            className={classNames(
                                'button aspect-square size-8 flex justify-center items-center',
                                !hasNextSibling && 'opacity-30 cursor-not-allowed'
                            )}
                            onClick={handleNextSibling}
                            disabled={!hasNextSibling}
                            title="Next branch"
                        >
                            <LuChevronRight />
                        </button>
                    </>
                )}

                {/* Standard actions */}
                <button
                    className="button gap-2 aspect-square size-8 flex justify-center items-center"
                    onClick={handleCopy}
                    title="Copy message"
                >
                    <LuCopy />
                </button>
                {match(messageData.sender_role)
                    .with('user', () => (
                        <button
                            className="button gap-2 aspect-square size-8 flex justify-center items-center"
                            onClick={handleEdit}
                            title="Edit message"
                            disabled={!onEdit}
                        >
                            <LuPencil />
                        </button>
                    ))
                    .otherwise(() => null)}
            </div>
        </div>
    );
};

export const ChatDataStream = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
    const { combinedContent, toolCalls, isLoading, error, isComplete } = useWorkshopStreamMessage(
        chatId,
        messageId
    );

    if (isLoading)
        return (
            <div className="flex items-center gap-2">
                <LuBrain />
                Thinking...
            </div>
        );

    if (error) return <div>Error: {error}</div>;

    return (
        <>
            {/* Display tool calls */}
            {toolCalls.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-primary shadow-sm">
                            <LuCog size={14} />
                        </div>
                        <h3 className="text-sm font-semibold text-primary">Tool Executions</h3>
                        <div className="flex-1 h-px bg-primary/20"></div>
                        <span className="text-xs text-primary/70 bg-secondary px-2 py-1 rounded-full border border-primary/20">
                            {toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {toolCalls.map((toolCall) => (
                            <ToolCallDisplay key={toolCall.tool_id} toolCall={toolCall} />
                        ))}
                    </div>
                </div>
            )}

            {/* Display regular content */}
            <div className="prose">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {combinedContent}
                </Markdown>
            </div>
            {!isComplete && !error && <span className="animate-pulse">▋</span>}
        </>
    );
};
