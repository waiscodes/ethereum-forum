import { FC } from 'react';

import { useTopicsLatest } from '@/api/topics';

import { MicroInfo } from '../tooltip/MicroInfo';
import { TopicPreview } from './TopicPreview';

export const TopicList: FC = () => {
    const { data, isLoading } = useTopicsLatest();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="text-lg font-bold border-b border-b-primary flex justify-between items-baseline">
                Latest threads
                <MicroInfo>
                    <div>
                        Sorted by <b>latest activity</b> first
                    </div>
                </MicroInfo>
            </div>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mx-auto">
                {data?.map((topic) => <TopicPreview key={topic.topic_id} topic={topic} />)}
            </div>
        </div>
    );
};
