import { formatDistanceToNow, parseISO } from 'date-fns';
import { FiRefreshCcw } from 'react-icons/fi';
import { SiZoom } from 'react-icons/si';

import { Meeting, useEvents } from '@/api/events';

export const Meetings = () => {
    const { data } = useEvents();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {
                data?.map((event) => (
                    <div key={event.uid} className="card flex flex-col gap-2">
                        <div className="flex items-center gap-2 justify-between">
                            <h3 className="font-bold">{event.summary}</h3>
                            <div>
                                {
                                    event.occurance == 'Recurring' && <FiRefreshCcw className="size-3" />
                                }
                            </div>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: event.description ?? '' }} className="grow max-h-40 overflow-y-auto" />
                        <div className="flex justify-between flex-wrap">
                            <div>
                                {
                                    event.meeting && (
                                        <MeetingLink meeting={event.meeting} />
                                    )
                                }
                            </div>
                            <p className="text-sm text-gray-500 text-end">
                                {event.start && formatDistanceToNow(parseISO(event.start), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))
            }
        </div>
    );
};

const platformToIcon = {
    Zoom: <SiZoom />
};

export const MeetingLink = ({ meeting }: { meeting: Meeting }) => {
    return (
        <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-primary px-1.5 rounded-sm bg-primary">
            {platformToIcon[meeting.type]}
            <span className="text-sm">{meeting.type}</span>
        </a>
    );
};
