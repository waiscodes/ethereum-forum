import { Link } from '@tanstack/react-router';
import { FC } from 'react';

import { Topic } from '@/api/topics';
import { formatDistanceToNow } from 'date-fns';

type Participant = {
    id: number;
    name: string;
    username: string;
    flair_url: string | null;
    flair_name: string | null;
    post_count: number;
    flair_color: string | null;
    trust_level: number;
    flair_bg_color: string | null;
    flair_group_id: string | null;
    avatar_template: string;
    primary_group_name: string | null;
};

export const TopicPreview: FC<{ topic: Topic }> = ({ topic }) => {
    const extra = (topic.extra || {}) as Record<string, unknown>;
    const tags = extra?.tags as string[];
    const participants = extra?.['details']?.['participants'] as Participant[];

    return (
        <Link to="/t/$topicId" params={{ topicId: topic.topic_id.toString() }} className="card hover:border-primary border border-transparent space-y-1">
            <div className="font-bold">{topic.title}</div>
            <div className="flex gap-0">
                {
                    participants?.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-2">
                            <img src={'https://ethereum-magicians.org' + participant.avatar_template.replace('{size}', '40')} alt={participant.username} className="w-4 h-4 rounded-full" />
                        </div>
                    ))
                }
            </div>
            <div className="flex justify-between items-start">
                <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => (
                        <div key={tag} className="text-sm text-gray-500 bg-primary px-1 border border-primary">{tag}</div>
                    ))}
                </div>
                <div>
                    {formatDistanceToNow(topic.created_at).replace('about ', '')} ago
                </div>
            </div>
        </Link>
    );
};
