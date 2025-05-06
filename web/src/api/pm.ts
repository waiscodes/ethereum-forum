import { queryOptions, useQuery } from '@tanstack/react-query';

import { useApi } from './api';
import { components } from './schema.gen';

export type PMMeetingData = components['schemas']['PMMeetingData'];

export const getPM = (issue_id: number | undefined) =>
    queryOptions({
        queryKey: ['pm', issue_id],
        queryFn: async () => {
            if (!issue_id) {
                return null;
            }

            const response = await useApi('/pm/{issue_id}', 'get', {
                path: {
                    issue_id,
                },
            });

            const events = response.data as PMMeetingData;

            return events;
        },
        refetchInterval: 1000 * 60,
        enabled: !!issue_id,
    });

export const usePM = (issue_id: number | undefined) => useQuery(getPM(issue_id));
