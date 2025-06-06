import classNames from 'classnames';
import { useMemo } from 'react';

import { MessageTreeNode } from '@/components/workshop/ChatMessage';

interface ConversationGraphProps {
    rootNodes: MessageTreeNode[];
    visibleMessages: MessageTreeNode[];
    messageMap: Map<string, MessageTreeNode>;
}

interface GraphNode {
    messageId: string;
    level: number;
    column: number;
    isVisible: boolean;
    hasChildren: boolean;
    siblings: number;
    siblingIndex: number;
    parentMessageId?: string;
}

export const ConversationGraph = ({
    rootNodes,
    visibleMessages,
    messageMap,
}: ConversationGraphProps) => {
    const { graphNodes, maxColumn } = useMemo(() => {
        const nodes: GraphNode[] = [];
        const visibleMessageIds = new Set(visibleMessages.map((node) => node.message.message_id));
        let maxCol = 0;

        // Layout the tree with proper spacing
        function layoutTree(
            node: MessageTreeNode,
            level: number = 0,
            startColumn: number = 0
        ): number {
            // If this is a leaf node, place it at the start column
            if (node.children.length === 0) {
                nodes.push({
                    messageId: node.message.message_id,
                    level,
                    column: startColumn,
                    isVisible: visibleMessageIds.has(node.message.message_id),
                    hasChildren: false,
                    siblings: node.siblings.length,
                    siblingIndex: node.currentSiblingIndex,
                    parentMessageId: node.message.parent_message_id || undefined,
                });

                maxCol = Math.max(maxCol, startColumn);

                return startColumn + 1; // Return next available column
            }

            // For nodes with children, we need to center the parent over its children
            let currentColumn = startColumn;
            const childColumns: number[] = [];

            // First, layout all children and collect their column positions
            node.children.forEach((child) => {
                const childColumn = currentColumn;

                childColumns.push(childColumn);
                currentColumn = layoutTree(child, level + 1, currentColumn);
            });

            // Center the parent over its children
            const firstChildColumn = childColumns[0];
            const lastChildColumn = childColumns[childColumns.length - 1];
            const parentColumn = Math.floor((firstChildColumn + lastChildColumn) / 2);

            nodes.push({
                messageId: node.message.message_id,
                level,
                column: parentColumn,
                isVisible: visibleMessageIds.has(node.message.message_id),
                hasChildren: true,
                siblings: node.siblings.length,
                siblingIndex: node.currentSiblingIndex,
                parentMessageId: node.message.parent_message_id || undefined,
            });

            maxCol = Math.max(maxCol, parentColumn);

            return currentColumn; // Return the next available column after all children
        }

        // Layout root nodes with proper spacing
        let currentColumn = 0;

        rootNodes.forEach((rootNode) => {
            currentColumn = layoutTree(rootNode, 0, currentColumn);
        });

        // Sort by level first, then by column for proper rendering order
        nodes.sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;

            return a.column - b.column;
        });

        return { graphNodes: nodes, maxColumn: maxCol };
    }, [rootNodes, visibleMessages, messageMap]);

    if (graphNodes.length === 0) {
        return null;
    }

    const columnWidth = 40;
    const rowHeight = 28;

    return (
        <div className="space-y-1.5">
            <div className="px-1.5">
                <h3 className="font-bold w-full border-b border-b-primary pb-1">
                    Conversation Tree
                </h3>
            </div>
            <div className="px-1.5 relative overflow-x-auto">
                <div
                    className="relative min-w-full"
                    style={{
                        width: `${Math.max(200, (maxColumn + 1) * columnWidth + 60)}px`,
                        height: `${graphNodes.length * rowHeight + 40}px`,
                    }}
                >
                    {/* Add SVG for the lines */}
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            width: `${Math.max(200, (maxColumn + 1) * columnWidth + 60)}px`,
                            height: `${graphNodes.length * rowHeight + 40}px`,
                        }}
                    >
                        {graphNodes.map((node) => {
                            const nodeIndex = graphNodes.findIndex(
                                (n) => n.messageId === node.messageId
                            );
                            const nodeY = nodeIndex * rowHeight + 20;
                            const nodeX = node.column * columnWidth + 20;

                            // Find parent node for connection
                            const parentNode = node.parentMessageId
                                ? graphNodes.find((n) => n.messageId === node.parentMessageId)
                                : null;

                            if (parentNode) {
                                const parentIndex = graphNodes.findIndex(
                                    (n) => n.messageId === parentNode.messageId
                                );
                                const parentY = parentIndex * rowHeight + 20;
                                const parentX = parentNode.column * columnWidth + 20;

                                return (
                                    <g key={`line-${node.messageId}`}>
                                        {/* Vertical line from parent */}
                                        <line
                                            x1={parentX}
                                            y1={parentY + 6}
                                            x2={parentX}
                                            y2={nodeY - 6}
                                            stroke="rgb(var(--theme-border) / 0.4)"
                                            strokeWidth="2"
                                        />
                                        {/* Horizontal line to child if different column */}
                                        {parentX !== nodeX && (
                                            <line
                                                x1={parentX}
                                                y1={nodeY}
                                                x2={nodeX}
                                                y2={nodeY}
                                                stroke="rgb(var(--theme-border) / 0.4)"
                                                strokeWidth="2"
                                            />
                                        )}
                                    </g>
                                );
                            }

                            return null;
                        })}
                    </svg>

                    {/* Render message dots */}
                    {graphNodes.map((node, index) => (
                        <div
                            key={node.messageId}
                            className="absolute flex items-center gap-3"
                            style={{
                                left: `${node.column * columnWidth + 12}px`,
                                top: `${index * rowHeight + 12}px`,
                            }}
                        >
                            {/* Message dot */}
                            <div
                                className={classNames(
                                    'size-3 rounded-full border-2 flex-shrink-0 relative z-10',
                                    node.isVisible
                                        ? 'bg-secondary border-secondary'
                                        : 'bg-primary/60 border-primary/40',
                                    'hover:scale-125 transition-transform cursor-pointer'
                                )}
                                title={`Message ${index + 1}${
                                    node.siblings > 1
                                        ? ` (branch ${node.siblingIndex + 1}/${node.siblings})`
                                        : ''
                                }${node.hasChildren ? ' - has replies' : ''}`}
                            />

                            {/* Branch info (only for visible messages) */}
                            {node.isVisible && node.siblings > 1 && (
                                <div className="text-xs text-secondary font-mono bg-secondary/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {node.siblingIndex + 1}/{node.siblings}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="text-xs text-primary/60 mt-4 pt-2 border-t border-primary/20">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-secondary border-2 border-secondary" />
                            <span>Current conversation path</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-primary/60 border-2 border-primary/40" />
                            <span>Alternative branches</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="20" height="10" className="flex-shrink-0">
                                <line
                                    x1="2"
                                    y1="5"
                                    x2="18"
                                    y2="5"
                                    stroke="rgb(var(--theme-border) / 0.4)"
                                    strokeWidth="2"
                                />
                            </svg>
                            <span>Message connections</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
