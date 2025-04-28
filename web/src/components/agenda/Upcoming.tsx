import { Link } from '@tanstack/react-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { SiZoom } from 'react-icons/si';

import { useEvents } from '@/api/events';

export const ProtocolAgendaUpcoming = () => {
    const { data } = useEvents();

    return (
        <div className="space-y-2">
            <h3 className="font-bold w-full border-b border-b-primary pb-1 ml-1.5">Protocol Agenda</h3>
            <ul>
                {
                    data?.map((event) => (
                        <li key={event.uid}>
                            <Link to="/c/$channelId" params={{ channelId: 'agenda' }} className="flex justify-between hover:bg-secondary pl-1.5 gap-3">
                                <div className="flex items-center gap-1 truncate">
                                    <h4 className="truncate">{event.summary}</h4>
                                    {event.meeting?.type === 'Zoom' && <SiZoom className="size-5" />}
                                </div>
                                <p className="text-sm flex-1 whitespace-nowrap text-gray-500 text-end">
                                    {event.start && formatDistanceToNow(parseISO(event.start), { addSuffix: true }).replace('about ', '')}
                                </p>
                            </Link>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
};
