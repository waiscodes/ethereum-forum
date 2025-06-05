import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

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
        mutationFn: async ({ topicId }: { topicId: string }) => {
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
