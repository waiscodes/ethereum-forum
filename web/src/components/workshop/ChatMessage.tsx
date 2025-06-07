import '../../styles/code.css';

import classNames from 'classnames';
import * as Prism from 'prismjs';
import React, { useEffect, useRef, useState } from 'react';

// This ensures prism is loaded first
// @ts-ignore
// eslint-disable-next-line
const data = Prism.util;

// Import JSON language support for Prism
import 'prismjs/components/prism-json';

import { Link } from '@tanstack/react-router';
import {
    LuBrain,
    LuCheck,
    LuChevronDown,
    LuChevronLeft,
    LuChevronRight,
    LuChevronUp,
    LuCog,
    LuCopy,
    LuLoader,
    LuPencil,
    LuUser,
    LuX,
} from 'react-icons/lu';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match } from 'ts-pattern';

import { components } from '@/api/schema.gen';
import { useTopic } from '@/api/topics';
import { useUser } from '@/api/user';
import { useWorkshopStreamMessage, WorkshopMessage } from '@/api/workshop';
import { Tooltip } from '@/components/tooltip/Tooltip';

// Helper function to check if a string is valid JSON
const isValidJSON = (str: string): boolean => {
    try {
        JSON.parse(str);

        return true;
    } catch {
        return false;
    }
};

// Helper function to format JSON string
const formatJSON = (str: string): string => {
    try {
        return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
        return str;
    }
};

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
        <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">🔧 Tool Calls:</div>
            {toolCalls.map((toolCall) => (
                <ToolCallDisplay key={toolCall.tool_id} toolCall={toolCall} />
            ))}
        </div>
    );
};

// Tool Call Display Component
const ToolCallDisplay = ({ toolCall }: { toolCall: components['schemas']['ToolCallEntry'] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isResultExpanded, setIsResultExpanded] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    // Apply Prism highlighting when content changes
    useEffect(() => {
        if (codeRef.current && isResultExpanded && toolCall.result) {
            Prism.highlightElement(codeRef.current);
        }
    }, [isResultExpanded, toolCall.result]);

    const getStatusIcon = () => {
        switch (toolCall.status) {
            case 'Starting':
                return <LuCog className="animate-spin text-blue-500" />;
            case 'Executing':
                return <LuLoader className="animate-spin text-yellow-500" />;
            case 'Success':
                return <LuCheck className="text-green-500" />;
            case 'Error':
                return <LuX className="text-red-500" />;
            default:
                return <LuCog className="text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (toolCall.status) {
            case 'Starting':
                return 'border-blue-200 bg-blue-50';
            case 'Executing':
                return 'border-yellow-200 bg-yellow-50';
            case 'Success':
                return 'border-green-200 bg-green-50';
            case 'Error':
                return 'border-red-200 bg-red-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const getStatusText = () => {
        switch (toolCall.status) {
            case 'Starting':
                return 'Starting...';
            case 'Executing':
                return 'Executing...';
            case 'Success':
                return 'Completed';
            case 'Error':
                return 'Failed';
            default:
                return 'Unknown';
        }
    };

    const isResultJSON = toolCall.result && isValidJSON(toolCall.result);
    const formattedResult = isResultJSON ? formatJSON(toolCall.result!) : toolCall.result;
    const shouldShowExpand = toolCall.result && toolCall.result.length > 200;

    // Disable syntax highlighting for large payloads to prevent performance issues
    const isResultTooLarge = toolCall.result && toolCall.result.length > 10000;
    const shouldHighlight = isResultJSON && !isResultTooLarge;

    return (
        <div
            className={classNames(
                'border rounded-lg p-3 mb-2 transition-all duration-200',
                getStatusColor()
            )}
        >
            <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="font-medium text-sm">Tool: {toolCall.tool_name}</span>
                <span className="text-xs text-gray-500">{getStatusText()}</span>
                {(toolCall.arguments || shouldShowExpand) && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-auto text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                        {isExpanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                )}
            </div>

            {isExpanded && toolCall.arguments && (
                <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">Arguments:</div>
                    <div className="bg-gray-100 rounded p-2 text-xs font-mono overflow-x-auto">
                        {isValidJSON(toolCall.arguments) ? (
                            <pre className="language-json">
                                <code>{formatJSON(toolCall.arguments)}</code>
                            </pre>
                        ) : (
                            <pre>{toolCall.arguments}</pre>
                        )}
                    </div>
                </div>
            )}

            {toolCall.result && (
                <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center justify-between">
                        <span>{toolCall.status === 'Error' ? 'Error:' : 'Result:'}</span>
                        {shouldShowExpand && (
                            <button
                                onClick={() => setIsResultExpanded(!isResultExpanded)}
                                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                                {isResultExpanded ? (
                                    <LuChevronUp size={12} />
                                ) : (
                                    <LuChevronDown size={12} />
                                )}
                                {isResultExpanded ? 'Collapse' : 'Expand'}
                            </button>
                        )}
                    </div>
                    <div
                        className={classNames(
                            'rounded text-xs overflow-x-auto transition-all duration-200',
                            toolCall.status === 'Error' ? 'bg-red-100 text-red-800' : 'bg-gray-100',
                            // Height control based on expansion state
                            isResultExpanded || !shouldShowExpand
                                ? 'max-h-96 overflow-y-auto'
                                : 'max-h-20 overflow-hidden'
                        )}
                    >
                        {shouldHighlight ? (
                            <pre className="language-json">
                                <code ref={codeRef}>{formattedResult}</code>
                            </pre>
                        ) : (
                            <pre className="whitespace-pre-wrap p-4">{formattedResult}</pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Extended WorkshopMessage type that includes streaming_events
interface ExtendedWorkshopMessage extends WorkshopMessage {
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
    const messageData = node?.message || message!;
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
                className="border p-4 border-primary/50 rounded-md pr-6"
            >
                {/* Show stored streaming events if they exist */}
                {messageData.streaming_events && messageData.streaming_events.length > 0 && (
                    <StoredStreamingEvents events={messageData.streaming_events} />
                )}
                <div className="prose">
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
                            className="button flex items-center gap-2"
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
                <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">🔧 Tool Calls:</div>
                    {toolCalls.map((toolCall) => (
                        <ToolCallDisplay key={toolCall.tool_id} toolCall={toolCall} />
                    ))}
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
