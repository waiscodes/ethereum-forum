import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/util/query';

import { useApi } from './api';

export const getWorkshopChats = () =>
    queryOptions({
        queryKey: ['workshop', 'chats'],
        queryFn: async () => {
            const response = await useApi('/ws/chat', 'get', {});

            return response.data;
        },
    });

export const useWorkshopChats = () => useQuery(getWorkshopChats());

export const getWorkshopChatMessages = (chatId: string) =>
    queryOptions({
        queryKey: ['workshop', 'chat', chatId],
        queryFn: async () => {
            const response = await useApi('/ws/chat/{chat_id}', 'get', {
                path: { chat_id: chatId },
            });

            return response.data;
        },
    });

export const useWorkshopChatMessages = (chatId: string) =>
    useQuery(getWorkshopChatMessages(chatId));

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

            return response.data;
        },
        ...(options ?? {}),
    });
};
