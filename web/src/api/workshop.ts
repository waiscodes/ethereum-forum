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
