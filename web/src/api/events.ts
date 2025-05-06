import { queryOptions, useQuery } from '@tanstack/react-query';

import { useApi } from './api';
import { components } from './schema.gen';

export type CalendarEvent = components['schemas']['RichCalendarEvent'];
export type Meeting = components['schemas']['Meeting'];

export const getEvents = () =>
    queryOptions({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await useApi('/events', 'get', {});

            const events = response.data as CalendarEvent[];

            return events;
        },
        refetchInterval: 1000 * 60,
    });

export const useEvents = () => useQuery(getEvents());

export const useEventsUpcoming = () => {
    const { data: events, ...other } = useEvents();

    const now = new Date();
    const now_floor_hour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        0,
        0,
        0
    );

    const data = events?.filter((event) => {
        if (!event.start) return false;

        const event_start = new Date(event.start);

        return event_start >= now_floor_hour;
    });

    return { data, ...other };
};

export const getEventsRecent = () =>
    queryOptions({
        queryKey: ['events-recent'],
        queryFn: async () => {
            const response = await useApi('/events/recent', 'get', {});

            const events = response.data as CalendarEvent[];

            return events;
        },
    });

export const useEventsRecent = () => useQuery(getEventsRecent());
