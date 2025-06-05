import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';

import { queryClient } from '@/util/query';

import { useApi } from './api';
import { components } from './schema.gen';

export type WorkshopMessage = components['schemas']['WorkshopMessage'];

export const getWorkshopChats = () =>
    queryOptions({
        queryKey: ['workshop', 'chats'],
        queryFn: async () => {
            const response = await useApi('/ws/chat', 'get', {});

            return response.data;
        },
    });

export const useWorkshopChats = () => useQuery(getWorkshopChats());

export const getWorkshopChat = (chatId: string) =>
    queryOptions({
        queryKey: ['workshop', 'chat', chatId],
        queryFn: async () => {
            const response = await useApi('/ws/chat/{chat_id}', 'get', {
                path: { chat_id: chatId },
            });

            return response.data;
        },
        refetchInterval(query) {
            const messages = query.state.data?.messages;

            if (Array.isArray(messages) && messages.length > 0) {
                const lastMessage = messages[messages.length - 1];

                if (
                    lastMessage?.sender_role === 'assistant' &&
                    typeof lastMessage.message === 'string' &&
                    lastMessage.message.length === 0
                ) {
                    return 1000;
                }
            }
        },
    });

export const useWorkshopChat = (chatId: string) => useQuery(getWorkshopChat(chatId));

export const useWorkshopSendMessage = <T>(chatId: string, options?: T) => {
    return useMutation({
        mutationFn: async ({
            message,
            parent_message,
        }: {
            message: string;
            parent_message?: string;
        }) => {
            const response = await useApi('/ws/chat/{chat_id}', 'post', {
                path: { chat_id: chatId },
                data: { message },
                query: { parent_message },
                contentType: 'application/json; charset=utf-8',
            });

            queryClient.invalidateQueries({ queryKey: ['workshop', 'chat', chatId] });

            if (parent_message === undefined) {
                queryClient.invalidateQueries({ queryKey: ['workshop', 'chats'] });
            }

            return response.data;
        },
        ...(options ?? {}),
    });
};

export const useWorkshopCreateChatFromSummary = <K>(options?: K) => {
    return useMutation({
        mutationFn: async ({ topicId }: { topicId: number }) => {
            const response = await useApi('/ws/t/{topic_id}/summary/to-chat', 'post', {
                path: { topic_id: topicId },
            });

            queryClient.invalidateQueries({ queryKey: ['workshop', 'chats'] });
            queryClient.invalidateQueries({
                queryKey: ['workshop', 'chat', response.data.chat_id],
            });

            return response.data;
        },
        ...(options ?? {}),
    });
};

// use SSE to get the streaming response
// /ws/chat/:chat_id/:message_id/stream
export const useWorkshopStreamMessage = (chatId: string, messageId: string) => {
    const [data, setData] = React.useState<components['schemas']['StreamingResponse'][]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isComplete, setIsComplete] = React.useState(false);
    const hasReceivedDataRef = React.useRef(false);

    React.useEffect(() => {
        // Reset state when chatId or messageId changes
        setData([]);
        setIsLoading(true);
        setError(null);
        setIsComplete(false);
        hasReceivedDataRef.current = false;

        const eventSource = new EventSource(`/api/ws/chat/${chatId}/${messageId}/stream`);

        eventSource.onopen = () => {
            console.log('EventSource connection opened');
            setIsLoading(false);
        };

        eventSource.onmessage = (event) => {
            try {
                const response: components['schemas']['StreamingResponse'] = JSON.parse(event.data);

                hasReceivedDataRef.current = true;
                setData((prev) => [...prev, response]);

                // Check if the response indicates completion or error
                if (response.is_complete) {
                    setIsComplete(true);
                    eventSource.close();
                } else if (response.error) {
                    setIsComplete(true);
                    setError(response.error);
                    eventSource.close();
                }
            } catch (parseError) {
                console.error('Failed to parse EventSource message:', parseError);
                setError('Failed to parse server response');
                setIsComplete(true);
                eventSource.close();
            }
        };

        eventSource.onerror = (event) => {
            console.error('EventSource error:', event);

            // Only show error if we haven't received any data yet
            // This indicates a real connection problem, not normal stream completion
            if (!hasReceivedDataRef.current) {
                setError('Connection error occurred');
            }

            setIsLoading(false);
            setIsComplete(true);
            eventSource.close();
        };

        // Cleanup function
        return () => {
            eventSource.close();
        };
    }, [chatId, messageId]);

    // Combine all content from the responses
    const combinedContent = React.useMemo(() => {
        return data.map((response) => response.content).join('');
    }, [data]);

    return {
        data,
        combinedContent,
        isLoading,
        error,
        isComplete,
    };
};
