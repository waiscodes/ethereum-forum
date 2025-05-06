import { Link } from '@tanstack/react-router';
import { parseISO } from 'date-fns';
import { FiDroplet } from 'react-icons/fi';

import { useEventsUpcoming } from '@/api/events';

import { TimeAgo } from '../TimeAgo';
import { platformToIcon } from './Meetings';

export const ProtocolAgendaUpcoming = () => {
    const { data } = useEventsUpcoming();

    return (
        <div className="space-y-1.5">
            <div className="px-1.5">
                <h3 className="font-bold w-full border-b border-b-primary pb-1">Protocol Agenda</h3>
            </div>
            <ul>
                {data?.map((event) => {
                    const issueId = event.pm_number;

                    return (
                        <li key={event.uid}>
                            <Link
                                to={issueId ? '/pm/$issueId' : '/c/$channelId'}
                                params={
                                    issueId
                                        ? { issueId: issueId.toString() }
                                        : { channelId: 'agenda' }
                                }
                                className="flex justify-between hover:bg-secondary px-1.5 gap-3"
                            >
                                <div className="flex items-center gap-1 truncate text-base">
                                    {issueId && <FiDroplet className="text-base size-4" />}
                                    <h4 className="truncate">{event.summary}</h4>
                                    {event.meetings.map((meeting) => {
                                        return platformToIcon[meeting.type];
                                    })}
                                </div>
                                <p className="text-sm flex-1 whitespace-nowrap text-gray-500 text-end">
                                    {event.start && <TimeAgo date={parseISO(event.start)} />}
                                </p>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
