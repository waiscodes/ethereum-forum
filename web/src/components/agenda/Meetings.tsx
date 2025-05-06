import { parseISO } from 'date-fns';
import { FC } from 'react';
import { FiRefreshCcw } from 'react-icons/fi';
import { SiGooglemeet, SiYoutube, SiZoom } from 'react-icons/si';

import { CalendarEvent, Meeting } from '@/api/events';

import { TimeAgo } from '../TimeAgo';

export const Meetings: FC<{ data: CalendarEvent[] }> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {
                data?.map((event) => (
                    <div key={event.uid + event.start?.toString()} className="card flex flex-col gap-2">
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
                            <div className="flex flex-wrap gap-2">
                                {
                                    event.meetings.map((meeting) => (
                                        <MeetingLink key={meeting.link} meeting={meeting} />
                                    ))
                                }
                            </div>
                            <p className="text-sm text-gray-500 text-end flex items-end">
                                {event.start && <TimeAgo date={parseISO(event.start)} />}
                            </p>
                        </div>
                    </div>
                ))
            }
        </div>
    );
};

const platformToIcon = {
    Zoom: <SiZoom />,
    Google: <SiGooglemeet />,
    Youtube: <SiYoutube />,
};

export const MeetingLink = ({ meeting }: { meeting: Meeting }) => {
    return (
        <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 button">
            {platformToIcon[meeting.type]}
            <span className="text-sm">{meeting.type}</span>
        </a>
    );
};
