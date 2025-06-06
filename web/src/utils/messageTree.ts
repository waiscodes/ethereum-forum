import { WorkshopMessage } from '@/api/workshop';
import { MessageTreeNode } from '@/components/workshop/ChatMessage';

export interface MessagePath {
    [messageId: string]: string; // messageId -> selected child messageId
}

export function buildMessageTree(messages: WorkshopMessage[]): {
    rootNodes: MessageTreeNode[];
    messageMap: Map<string, MessageTreeNode>;
} {
    const messageMap = new Map<string, MessageTreeNode>();
    const childrenMap = new Map<string, WorkshopMessage[]>();

    // Group messages by parent
    for (const message of messages) {
        const parentId = message.parent_message_id || 'root';

        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, []);
        }

        childrenMap.get(parentId)!.push(message);
    }

    // Build tree nodes
    function buildNode(message: WorkshopMessage, siblings: WorkshopMessage[]): MessageTreeNode {
        const children = childrenMap.get(message.message_id) || [];
        const currentSiblingIndex = siblings.findIndex((s) => s.message_id === message.message_id);

        const node: MessageTreeNode = {
            message,
            children: children.map((child) => buildNode(child, children)),
            siblings,
            currentSiblingIndex,
        };

        messageMap.set(message.message_id, node);

        return node;
    }

    // Build root nodes (messages with no parent)
    const rootMessages = childrenMap.get('root') || [];
    const rootNodes = rootMessages.map((message) => buildNode(message, rootMessages));

    return { rootNodes, messageMap };
}

export function buildPathToMessage(
    messageMap: Map<string, MessageTreeNode>,
    targetMessageId: string
): MessagePath {
    const path: MessagePath = {};

    // Find the target message
    const targetNode = messageMap.get(targetMessageId);

    if (!targetNode) {
        return path;
    }

    // Build path by traversing up from target to root
    let currentMessage = targetNode.message;

    while (currentMessage.parent_message_id) {
        const parentNode = messageMap.get(currentMessage.parent_message_id);

        if (!parentNode) break;

        // Set this message as the selected child of its parent
        path[currentMessage.parent_message_id] = currentMessage.message_id;
        currentMessage = parentNode.message;
    }

    return path;
}

export function getVisiblePath(
    rootNodes: MessageTreeNode[],
    currentPath: MessagePath = {}
): MessageTreeNode[] {
    const visibleMessages: MessageTreeNode[] = [];

    function traverse(node: MessageTreeNode) {
        visibleMessages.push(node);

        // Find the selected child for this node
        const selectedChildId = currentPath[node.message.message_id];
        let selectedChild: MessageTreeNode | undefined;

        if (selectedChildId) {
            selectedChild = node.children.find((c) => c.message.message_id === selectedChildId);
        } else if (node.children.length > 0) {
            // Default to first child if no specific selection
            [selectedChild] = node.children;
        }

        if (selectedChild) {
            traverse(selectedChild);
        }
    }

    // Determine which root node to start from
    const selectedRootId = currentPath['root'];
    let startingRootNode: MessageTreeNode | undefined;

    if (selectedRootId) {
        // Find the root node with the selected ID
        startingRootNode = rootNodes.find((node) => node.message.message_id === selectedRootId);
    }

    // Default to first root node if no specific selection or selection not found
    if (!startingRootNode && rootNodes.length > 0) {
        [startingRootNode] = rootNodes;
    }

    if (startingRootNode) {
        traverse(startingRootNode);
    }

    return visibleMessages;
}

export function updatePath(
    currentPath: MessagePath,
    parentId: string,
    selectedChildId: string
): MessagePath {
    return {
        ...currentPath,
        [parentId]: selectedChildId,
    };
}
