import { FC } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import { useEventsRecent } from '@/api/events';

const parseYoutubeUrl = (url: string) => {
    if (!url) {
        return null;
    }

    if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1];
    }

    if (url.includes('v=')) {
        return url.split('v=')[1];
    }

    return null;
};

// https://i3.ytimg.com/vi/YvlLhvICtbc/maxresdefault.jpg
export const convertYoutubeUrlToThumbnailUrl = (url: string) => {
    const videoId = parseYoutubeUrl(url);

    return `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
};

export const AgendaVideos: FC = () => {
    // past events
    // filter by youtube video only
    const { data: recent } = useEventsRecent();
    const videos = recent?.filter(
        (event) =>
            event.meetings.some((meeting) => meeting.type.toLowerCase() === 'youtube') ||
            // @ts-ignore
            event.pm_data?.['occurrences']?.some((occurrence) => occurrence['youtube_streams'])
    );

    return (
        <div className="space-y-2">
            <h2 className="text-2xl font-bold">Videos</h2>
            <hr className="border-t border-primary" />
            <div className="card">
                <p>This page is under construction.</p>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {videos?.map((event) => (
                    <li key={'video' + event.uid} className="border p-2">
                        <h3>{event.summary}</h3>
                        <ul className="flex flex-col gap-2">
                            {event.pm_data?.['occurrences']?.map((occurrence) => (
                                <li key={occurrence.occurrence_id} className="card">
                                    {JSON.stringify(occurrence['youtube_streams'])}
                                    {occurrence['youtube_streams']?.map((stream) => (
                                        <li key={stream.stream_url}>
                                            <LiteYouTubeEmbed
                                                id={parseYoutubeUrl(stream.stream_url || '') || ''}
                                                title={'PM Meeting'} // For accessibility, never shown
                                                adNetwork={false}
                                                poster="maxresdefault"
                                                cookie={false}
                                            />{' '}
                                        </li>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};
