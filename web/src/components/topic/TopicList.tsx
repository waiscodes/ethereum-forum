import { FC } from 'react';

import { useTopics } from '@/api/topics';

import { TopicPreview } from './TopicPreview';
export const TopicList: FC = () => {
    const { data, isLoading } = useTopics();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="text-lg font-bold">Trending this week</div>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mx-auto">
                {data?.map((topic) => <TopicPreview key={topic.topic_id} topic={topic} />)}
            </div>
        </div>
    );
};
