import { queryOptions, useQuery } from '@tanstack/react-query';

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
