import { Link } from '@tanstack/react-router';
import { parseISO } from 'date-fns';
import { SiZoom } from 'react-icons/si';

import { useEventsUpcoming } from '@/api/events';

import { TimeAgo } from '../TimeAgo';

export const ProtocolAgendaUpcoming = () => {
    const { data } = useEventsUpcoming();

    return (
        <div className="space-y-1.5">
            <div className="px-1.5">
                <h3 className="font-bold w-full border-b border-b-primary pb-1">Protocol Agenda</h3>
            </div>
            <ul>
                {data?.map((event) => (
                    <li key={event.uid}>
                        <Link
                            to="/c/$channelId"
                            params={{ channelId: 'agenda' }}
                            className="flex justify-between hover:bg-secondary px-1.5 gap-3"
                        >
                            <div className="flex items-center gap-1 truncate">
                                <h4 className="truncate">{event.summary}</h4>
                                {event.meeting?.type === 'Zoom' && <SiZoom className="size-5" />}
                            </div>
                            <p className="text-sm flex-1 whitespace-nowrap text-gray-500 text-end">
                                {event.start && <TimeAgo date={parseISO(event.start)} />}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};
