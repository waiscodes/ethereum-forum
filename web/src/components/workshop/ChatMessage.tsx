import classNames from 'classnames';
import { LuBrain, LuChevronLeft, LuChevronRight, LuCopy, LuPencil } from 'react-icons/lu';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match } from 'ts-pattern';

import { useWorkshopStreamMessage, WorkshopMessage } from '@/api/workshop';

export interface MessageTreeNode {
    message: WorkshopMessage;
    children: MessageTreeNode[];
    siblings: WorkshopMessage[];
    currentSiblingIndex: number;
}

export interface ChatMessageProps {
    node?: MessageTreeNode;
    message?: WorkshopMessage;
    onEdit?: (message: WorkshopMessage) => void;
    onNavigate?: (message: WorkshopMessage) => void;
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
                <div className="prose">
                    <Markdown remarkPlugins={[remarkGfm]}>{messageData.message}</Markdown>
                    {messageData.message.length === 0 && (
                        <ChatDataStream
                            chatId={messageData.chat_id}
                            messageId={messageData.message_id}
                        />
                    )}
                </div>
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
    const { combinedContent, isLoading, error, isComplete } = useWorkshopStreamMessage(
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
            <Markdown remarkPlugins={[remarkGfm]}>{combinedContent}</Markdown>
            {!isComplete && !error && <span className="animate-pulse">▋</span>}
        </>
    );
};
