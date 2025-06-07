import classNames from 'classnames';
import Prism from 'prismjs';
import React, { useEffect, useRef, useState } from 'react';
import {
    LuCheck,
    LuChevronDown,
    LuChevronLeft,
    LuCode,
    LuCog,
    LuLoader,
    LuTriangle,
    LuX,
} from 'react-icons/lu';
import { match } from 'ts-pattern';

import { components } from '@/api/schema.gen';
import { formatJSON, getToolDisplayName, isValidJSON } from '@/util/format';
import { getRichRendering, getStatusStyles, getStatusText, isSearchTool } from '@/util/tool';

import { ToolResultDisplay } from './ToolResultDisplay';

// This ensures prism is loaded first
// @ts-ignore
// eslint-disable-next-line
const data = Prism.util;

import 'prismjs/components/prism-json';

interface ToolCallDisplayProps {
    toolCall: components['schemas']['ToolCallEntry'];
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
    // Show entire content expanded by default for completed calls, collapsed for unknown status
    const shouldExpandByDefault = true;
    const [isExpanded, setIsExpanded] = useState(shouldExpandByDefault);
    const [isResultExpanded, setIsResultExpanded] = useState(false);

    // Determine if we're doing rich rendering (custom components) vs fallback rendering
    const hasRichRendering = getRichRendering(toolCall.tool_name);

    // Input parameters: collapsed by default if rich rendering, expanded if fallback
    const [isInputExpanded, setIsInputExpanded] = useState(!hasRichRendering);
    const codeRef = useRef<HTMLElement>(null);

    // Apply Prism highlighting when content changes
    useEffect(() => {
        if (codeRef.current && isResultExpanded && toolCall.result) {
            Prism.highlightElement(codeRef.current);
        }
    }, [isResultExpanded, toolCall.result]);

    const getStatusIcon = () => {
        switch (toolCall.status.toLowerCase()) {
            case 'starting':
                return <LuCog className="animate-spin text-secondary" size={16} />;
            case 'executing':
                return <LuLoader className="animate-spin text-warning" size={16} />;
            case 'success':
                return <LuCheck className="text-success" size={16} />;
            case 'error':
                return <LuX className="text-error" size={16} />;
            default:
                return <LuCog className="text-primary/60" size={16} />;
        }
    };

    const formatInputSummary = (toolName: string, args: string) => {
        try {
            const parsedArgs = JSON.parse(args);

            return match(toolName)
                .with('search_forum', () => `Searching for "${parsedArgs.query || 'unknown'}"`)
                .with(
                    'search_topics',
                    () => `Searching topics for "${parsedArgs.query || 'unknown'}"`
                )
                .with(
                    'search_posts',
                    () => `Searching posts for "${parsedArgs.query || 'unknown'}"`
                )
                .with(
                    'search_posts_in_topic',
                    () =>
                        `Searching topic ${parsedArgs.topic_id || 'unknown'} for "${parsedArgs.query || 'unknown'}"`
                )
                .with(
                    'get_topic_summary',
                    () => `Getting summary of topic ${parsedArgs.topic_id || 'unknown'}`
                )
                .with(
                    'get_posts',
                    () =>
                        `Fetching posts from topic ${parsedArgs.topic_id || 'unknown'}${parsedArgs.page ? ` (page ${parsedArgs.page})` : ''}`
                )
                .with(
                    'search_by_user',
                    () =>
                        `Finding content by user ${parsedArgs.user_id || 'unknown'}${parsedArgs.query ? ` about "${parsedArgs.query}"` : ''}`
                )
                .with(
                    'search_by_username',
                    'search_by_username_mention',
                    () =>
                        `Finding content by @${parsedArgs.username || parsedArgs.username_mention || 'unknown'}${parsedArgs.query ? ` about "${parsedArgs.query}"` : ''}`
                )
                .with(
                    'get_user_profile',
                    () => `Getting profile for @${parsedArgs.username || 'unknown'}`
                )
                .with(
                    'get_user_summary',
                    () => `Getting activity summary for @${parsedArgs.username || 'unknown'}`
                )
                .with(
                    'username_to_user_id',
                    () => `Looking up user ID for @${parsedArgs.username || 'unknown'}`
                )
                .otherwise(() => {
                    // For unknown tools, try to extract the most relevant parameter
                    const keys = Object.keys(parsedArgs);

                    if (keys.length > 0) {
                        const mainParam = parsedArgs[keys[0]];

                        return `${getToolDisplayName(toolName)}: ${mainParam}`;
                    }

                    return `Executing ${getToolDisplayName(toolName)}`;
                });
        } catch {
            return `Executing ${getToolDisplayName(toolName)}`;
        }
    };

    const isResultJSON = toolCall.result && isValidJSON(toolCall.result);
    const formattedResult = isResultJSON ? formatJSON(toolCall.result!) : toolCall.result;

    // Disable syntax highlighting for large payloads to prevent performance issues
    const isResultTooLarge = toolCall.result && toolCall.result.length > 10000;
    const shouldHighlight = isResultJSON && !isResultTooLarge;

    const styles = getStatusStyles(toolCall.status);

    return (
        <div
            className={classNames(
                'border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md',
                styles.container
            )}
        >
            {/* Header Section */}
            <div
                className={classNames(
                    'border-b rounded-t-lg px-4 py-3 transition-all duration-200',
                    styles.header
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-sm">
                            {getStatusIcon()}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary text-sm">
                                    {getToolDisplayName(toolCall.tool_name)}
                                </span>
                                <span
                                    className={classNames(
                                        'px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center',
                                        styles.badge
                                    )}
                                >
                                    {getStatusText(toolCall.status)}
                                </span>
                            </div>
                            {toolCall.arguments && (
                                <div className="space-y-1">
                                    <span className="text-xs text-primary/70 leading-4">
                                        {formatInputSummary(toolCall.tool_name, toolCall.arguments)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="button aspect-square flex items-center justify-center"
                    >
                        {isExpanded ? <LuChevronDown size={14} /> : <LuChevronLeft size={14} />}
                    </button>
                </div>
            </div>

            {toolCall.arguments && isExpanded && (
                <div className="px-4 py-4 border-b border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LuCode className="text-primary/60" size={14} />
                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wide">
                                Input Parameters
                            </span>
                        </div>
                        <button
                            onClick={() => setIsInputExpanded(!isInputExpanded)}
                            className="button aspect-square flex items-center justify-center"
                        >
                            {isInputExpanded ? (
                                <LuChevronDown size={12} />
                            ) : (
                                <LuChevronLeft size={12} />
                            )}
                        </button>
                    </div>
                    {isInputExpanded && (
                        <div className="bg-secondary rounded-lg overflow-x-auto border border-primary/20">
                            {isValidJSON(toolCall.arguments) ? (
                                <pre className="language-json text-xs p-3">
                                    <code className="text-primary">
                                        {formatJSON(toolCall.arguments)}
                                    </code>
                                </pre>
                            ) : (
                                <pre className="text-xs text-primary font-mono p-3">
                                    {toolCall.arguments}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Results Section */}
            {toolCall.result && isExpanded && (
                <div className="px-4 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {toolCall.status.toLowerCase() === 'error' ? (
                                <LuTriangle className="text-error" size={14} />
                            ) : (
                                <LuCheck className="text-success" size={14} />
                            )}
                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wide">
                                {toolCall.status.toLowerCase() === 'error'
                                    ? 'Error Details'
                                    : 'Output Result'}
                            </span>
                        </div>
                        {toolCall.result &&
                            toolCall.result.length > 200 &&
                            !isSearchTool(toolCall.tool_name) && (
                                <button
                                    onClick={() => setIsResultExpanded(!isResultExpanded)}
                                    className="button aspect-square flex items-center justify-center"
                                >
                                    {isResultExpanded ? (
                                        <LuChevronDown size={12} />
                                    ) : (
                                        <LuChevronLeft size={12} />
                                    )}
                                </button>
                            )}
                    </div>
                    {/* Custom Tool Result Display */}
                    {toolCall.status.toLowerCase() === 'success' && toolCall.result ? (
                        <ToolResultDisplay
                            toolName={toolCall.tool_name}
                            result={toolCall.result}
                            isExpanded={
                                isResultExpanded ||
                                (toolCall.result && toolCall.result.length <= 200) ||
                                isSearchTool(toolCall.tool_name) ||
                                false
                            }
                            onExpand={() => setIsResultExpanded(true)}
                        />
                    ) : (
                        /* Fallback to raw display for errors or other cases */
                        <div
                            className={classNames(
                                'rounded-lg overflow-hidden transition-all duration-300 border',
                                toolCall.status.toLowerCase() === 'error'
                                    ? 'bg-error/10 border-error/30'
                                    : 'bg-secondary border-primary/20',
                                isResultExpanded ||
                                    (toolCall.result && toolCall.result.length <= 200)
                                    ? 'max-h-96 overflow-y-auto'
                                    : 'max-h-24 overflow-hidden'
                            )}
                        >
                            {shouldHighlight ? (
                                <pre className="language-json text-xs p-3">
                                    <code ref={codeRef} className="text-primary">
                                        {formattedResult}
                                    </code>
                                </pre>
                            ) : (
                                <pre
                                    className={classNames(
                                        'text-xs p-3 font-mono whitespace-pre-wrap',
                                        toolCall.status.toLowerCase() === 'error'
                                            ? 'text-error'
                                            : 'text-primary'
                                    )}
                                >
                                    {formattedResult}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
