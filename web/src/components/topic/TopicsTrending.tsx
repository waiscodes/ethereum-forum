import { FC } from 'react';

import { useTopicsTrending } from '@/api/topics';

import { TopicPreview } from './TopicPreview';
export const TopicsTrending: FC = () => {
    const { data, isLoading } = useTopicsTrending();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="text-lg font-bold border-b border-b-primary">Trending this week</div>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mx-auto">
                {data
                    ?.slice(0, 6)
                    .sort(
                        (a, b) =>
                            new Date(b.last_post_at ?? '').getTime() -
                            new Date(a.last_post_at ?? '').getTime()
                    )
                    .map((topic) => <TopicPreview key={topic.topic_id} topic={topic} />)}
            </div>
        </div>
    );
};
