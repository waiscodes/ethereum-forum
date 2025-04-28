import { formatDistanceToNow, parseISO } from 'date-fns';
import { SiZoom } from 'react-icons/si';

import { useEvents } from '@/api/events';

export const ProtocolAgendaUpcoming = () => {
    const { data } = useEvents();

    return (
        <div>
            <h3 className="font-bold border-b border-b-primary pb-0.5">Protocol Agenda</h3>
            <ul>
                {
                    data?.map((event) => (
                        <li key={event.uid}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1 truncate">
                                    <h4 className="truncate">{event.summary}</h4>
                                    {event.meeting?.type === 'Zoom' && <SiZoom className="size-5" />}
                                </div>
                                <p className="text-sm flex-1 whitespace-nowrap text-gray-500 text-end">
                                    {event.start && formatDistanceToNow(parseISO(event.start), { addSuffix: true }).replace('about ', '')}
                                </p>
                            </div>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
};
