import { useTopicsLatest } from '@/api/topics';
import { decodeCategory } from '@/util/category';

import { TopicPreview } from '../topic/TopicPreview';

export const EIPsContent = () => {
    const { data: topics } = useTopicsLatest();
    const eips = topics?.filter((topic) => {
        const category = (topic.extra ?? {})['category_id'] as number;

        return decodeCategory(category).includes('EIPs');
    });

    return (

        <div className="space-y-4">
            <div className="text-lg font-bold border-b border-b-primary">Latest Discussions</div>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mx-auto">
                {eips?.map((topic) => <TopicPreview key={topic.topic_id} topic={topic} />)}
            </div>
        </div>
    );
};
