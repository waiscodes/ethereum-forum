import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useApi } from './api';
import { components } from './schema.gen';

// Get the Post type from schema
export type Post = components['schemas']['Post'];

export const getPosts = (topicId: string, page: number) => queryOptions({
    queryKey: ['posts', topicId, page],
    queryFn: async () => {
        const response = await useApi('/t/{topic_id}/posts', 'get', {
            path: {
                topic_id: Number(topicId),
            },
            query: {
                page,
            },
        });

        return response.data;
    },
});

export const getPostsInfinite = (topicId: string) => infiniteQueryOptions({
    queryKey: ['posts', topicId, 'infinite'],
    initialPageParam: 1,
    getNextPageParam: (lastPage: Post[], allPages) => {
        // If the last page is empty, there are no more pages
        return lastPage.length === 0 ? undefined : allPages.length + 1;
    },
    queryFn: async ({ pageParam }) => {
        const response = await useApi('/t/{topic_id}/posts', 'get', {
            path: {
                topic_id: Number(topicId),
            },
            query: {
                page: pageParam,
            },
        });

        return response.data;
    },
});

export const usePosts = (topicId: string, page: number) => useQuery(getPosts(topicId, page));

export const usePostsInfinite = (topicId: string) => useInfiniteQuery(getPostsInfinite(topicId));
