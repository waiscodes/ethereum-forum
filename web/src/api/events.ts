import { queryOptions, useQuery } from '@tanstack/react-query';

import { useApi } from './api';
import { components } from './schema.gen';

export type CalendarEvent = components['schemas']['CalendarEvent'];

export const getEvents = () => queryOptions({
    queryKey: ['events'],
    queryFn: async () => {
        const response = await useApi('/events', 'get', {});

        return response.data as CalendarEvent[];
    },
});

export const useEvents = () => useQuery(getEvents());
