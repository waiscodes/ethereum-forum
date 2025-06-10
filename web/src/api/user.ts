import { useQuery } from '@tanstack/react-query';

import { useApi } from './api';

const getUser = (discourseId: string, username: string) => {
    return {
        queryKey: ['user', discourseId, username],
        queryFn: async () => {
            const response = await useApi('/du/{discourse_id}/{username}', 'get', {
                path: {
                    discourse_id: discourseId,
                    username: username,
                },
            });

            return response.data;
        },
    };
};

const getUserSummary = (discourseId: string, username: string) => {
    return {
        queryKey: ['userSummary', discourseId, username],
        queryFn: async () => {
            const response = await useApi('/du/{discourse_id}/{username}/summary', 'get', {
                path: {
                    discourse_id: discourseId,
                    username: username,
                },
            });

            return response.data;
        },
    };
};

export const useUser = (discourseId: string, username: string) =>
    useQuery(getUser(discourseId, username));

export const useUserSummary = (discourseId: string, username: string) =>
    useQuery(getUserSummary(discourseId, username));
