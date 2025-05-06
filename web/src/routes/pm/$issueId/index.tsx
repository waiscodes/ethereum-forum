import { createFileRoute, Link } from '@tanstack/react-router';
import { FiExternalLink, FiYoutube } from 'react-icons/fi';

import { getPM, PMMeetingData, usePM } from '@/api/pm';
import { components } from '@/api/schema.gen';
import { queryClient } from '@/util/query';

export const Route = createFileRoute('/pm/$issueId/')({
    component: RouteComponent,
    beforeLoad: async ({ params }) => {
        const { issueId } = params;
        const pm = await queryClient.ensureQueryData(getPM(Number(params.issueId)));
        const occurence = getOccurence(pm as any, Number(issueId));

        return {
            title: occurence?.issue_title,
        };
    },
});

type OneOffMeeting = components['schemas']['PMOneOffMeeting'];
type Occurrence = components['schemas']['PMOccurrence'];

function RouteComponent() {
    const { issueId } = Route.useParams();
    const { data: pm } = usePM(Number(issueId));
    const occurence = getOccurence(pm as any, Number(issueId));

    const content = (
        <div className="card whitespace-pre-wrap">{JSON.stringify(occurence, null, 2)}</div>
    );

    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <h1 className="">
                pm/<b>{issueId}</b>
            </h1>
            {occurence?.discourse_topic_id && (
                <Link
                    to="/t/$topicId"
                    params={{ topicId: occurence.discourse_topic_id }}
                    className="button flex w-fit items-center gap-2"
                >
                    Thread
                    <FiExternalLink />
                </Link>
            )}
            {occurence?.youtube_streams && occurence.youtube_streams.length > 0 && (
                <div className="card">
                    <h2>Youtube Streams</h2>
                    <ul>
                        {occurence.youtube_streams.map((stream) => (
                            <li key={stream.stream_url}>
                                <a
                                    href={stream.stream_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 button"
                                >
                                    <FiYoutube />
                                    {stream.stream_url}
                                </a>
                                <iframe
                                    src={convertYoutubeUrlToEmbedUrl(stream.stream_url)}
                                    width="100%"
                                    height="100%"
                                    className="w-full h-full aspect-video"
                                ></iframe>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {content}
        </div>
    );
}

export const getOccurence = (
    pm: PMMeetingData,
    issueId: number
): OneOffMeeting | Occurrence | null => {
    if (!pm) {
        return null;
    }

    if ('occurrences' in pm) {
        // @ts-ignore
        return pm.occurrences?.find((occurrence) => occurrence.issue_number === issueId) as
            | Occurrence
            | undefined;
    }

    if ('issue_number' in pm && pm.issue_number === issueId) {
        return pm;
    }

    return null;
};

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

const convertYoutubeUrlToEmbedUrl = (url: string) => {
    const videoId = parseYoutubeUrl(url);

    return `https://www.youtube.com/embed/${videoId}`;
};

// https://i3.ytimg.com/vi/YvlLhvICtbc/maxresdefault.jpg
export const convertYoutubeUrlToThumbnailUrl = (url: string) => {
    const videoId = parseYoutubeUrl(url);

    return `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
};
