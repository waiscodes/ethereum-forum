import classNames from 'classnames';
import { LuBrain, LuCopy, LuPencil } from 'react-icons/lu';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match } from 'ts-pattern';

import { useWorkshopStreamMessage, WorkshopMessage } from '@/api/workshop';

export const ChatMessage = ({ message }: { message: WorkshopMessage }) => {
    return (
        <div
            className={classNames(
                'flex flex-col gap-2',
                message.sender_role === 'user' && 'ml-auto w-fit',
                message.sender_role === 'assistant' && ''
            )}
            key={message.message_id}
        >
            {match(message.sender_role)
                .with('user', () => <div className="text-sm text-primary/50">You</div>)
                .with('assistant', () => <div className="text-sm text-primary/50">Assistant</div>)
                .otherwise(() => null)}

            <div key={message.message_id} className="border p-4 border-primary/50 rounded-md pr-6">
                <div className="prose">
                    <Markdown remarkPlugins={[remarkGfm]}>{message.message}</Markdown>
                    {message.message.length === 0 && (
                        <ChatDataStream chatId={message.chat_id} messageId={message.message_id} />
                    )}
                </div>
            </div>
            {match(message.sender_role)
                .with('user', () => (
                    <div className="text-sm text-primary/50 flex justify-end gap-2">
                        <button className="button gap-2 aspect-square size-8 flex justify-center items-center">
                            <LuCopy />
                        </button>
                        <button className="button flex items-center gap-2">
                            <LuPencil />
                        </button>
                    </div>
                ))
                .otherwise(() => null)}
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
