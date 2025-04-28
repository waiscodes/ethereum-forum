import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { FC } from 'react';
import { FiEye, FiHeart, FiMessageSquare } from 'react-icons/fi';

import { Topic } from '@/api/topics';
import { decodeCategory } from '@/util/category';

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
    const tags = [...decodeCategory(extra?.['category_id'] as number), ...(extra?.['tags'] as string[])];
    const participants = (extra?.details as Record<string, unknown>)?.participants as Participant[];

    return (
        <Link to="/t/$topicId" params={{ topicId: topic.topic_id.toString() }} className="card hover:border-primary border border-transparent gap-1 flex flex-col">
            <div className="font-bold">{topic.title}</div>
            <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                    <div key={tag} className="text-sm text-gray-500 bg-primary px-1 border border-primary">{tag}</div>
                ))}
            </div>
            <div className="flex gap-1 items-center">
                {
                    participants && participants.slice(0, 8).map((participant) => (
                        <div key={participant.id} className="flex items-center gap-2">
                            <div className='size-6'>
                                <img src={'https://ethereum-magicians.org' + participant.avatar_template.replace('{size}', '40')} alt={participant.username} className="size-full rounded-sm" />
                            </div>
                        </div>
                    ))
                }
                {
                    participants && participants.length > 8 && (
                        <div className="text-sm text-gray-500 bg-primary py-0.5 rounded-md px-1 leading-4">
                            +{participants.length - 8}
                        </div>
                    )
                }
            </div>
            <div className="grow"></div>
            <div className="flex justify-between items-start">
                <div className='flex items-center gap-2 justify-start'>
                    <div className='flex items-center gap-1'>
                        <FiEye />
                        {
                            topic?.view_count
                        }
                    </div>
                    <div className='flex items-center gap-1'>
                        <FiHeart />
                        {
                            topic?.like_count
                        }
                    </div>
                    <div className='flex items-center gap-1'>
                        <FiMessageSquare />
                        {
                            topic?.post_count
                        }
                    </div>
                </div>

                <div>
                    {topic.last_post_at && formatDistanceToNow(new Date(topic.last_post_at)).replace('about ', '')} ago
                </div>
            </div>
        </Link>
    );
};
