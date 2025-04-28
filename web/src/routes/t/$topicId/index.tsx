import { createFileRoute } from '@tanstack/react-router';
import classNames from 'classnames';
import { formatDistanceToNow } from 'date-fns';
import { Fragment } from 'react/jsx-runtime';
import { FiEye, FiHeart, FiMessageSquare } from 'react-icons/fi';
import { LuLink, LuMessageCircle, LuPaperclip, LuRefreshCcw } from 'react-icons/lu';

import { usePostsInfinite, useTopic, useTopicRefresh } from '@/api/topics';
import { TopicPost } from '@/components/topic/TopicPost';
import { decodeCategory } from '@/util/category';
import { formatBigNumber } from '@/util/numbers';

interface DiscourseUser {
  id: number,
  // stylistic
  name: string,
  // real
  username: string;
  avatar_template: string;
}

export const Route = createFileRoute('/t/$topicId/')({
  component: RouteComponent,
});

type RelevantLink = {
  url: string;
  title: string;
  internal: boolean;
  attachment: boolean;
  reflection: boolean;
  clicks: number;
  user_id: number;
  domain: string;
  root_domain: string;
};

function RouteComponent() {
  const { topicId } = Route.useParams();
  const { data: topic } = useTopic(topicId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = usePostsInfinite(topicId);

  const extra = topic?.extra as Record<string, unknown>;
  const tags = decodeCategory(extra?.['category_id'] as number);

  const relevant_links = extra?.details?.links as RelevantLink[];
  const creator = extra?.details?.created_by as DiscourseUser;

  return (
    <>
      <div className="right-bar space-y-4">
        <div>
          <h3 className="font-bold w-full border-b border-b-primary pb-1 mx-1.5">Thread Info</h3>
          <ul>
            {creator && (
              <li className="flex items-center gap-1 mx-1.5 justify-between">
                <div className="text-base">
                  Author
                </div>
                <a href={'https://ethereum-magicians.org/u/' + creator.username} className="flex items-center gap-1 hover:bg-secondary w-fit justify-end" target="_blank" rel="noreferrer">
                  <div className="size-4 rounded-full overflow-hidden">
                    <img src={'https://ethereum-magicians.org' + creator.avatar_template.replace('{size}', '48')} alt={creator.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-base truncate">
                    {creator.name}
                  </div>
                </a>
              </li>
            )}
            <li className="flex items-center gap-1 mx-1.5 justify-between">
              <div className="text-base">
                Created
              </div>
              <div className="text-base">
                {topic?.created_at && formatDistanceToNow(new Date(topic.created_at)).replace('about ', '')} ago
              </div>
            </li>
            <li className="flex items-center gap-1 mx-1.5 justify-between">
              <div className="text-base">
                Last Post
              </div>
              <div className="text-base">
                {topic?.last_post_at && formatDistanceToNow(new Date(topic.last_post_at)).replace('about ', '')} ago
              </div>
            </li>
            <li className="flex items-center gap-1 mx-1.5 justify-between">
              <div className="text-base">
                Source
              </div>
              <div className="text-base flex items-center">
                <a href={'https://ethereum-magicians.org/t/' + topic?.topic_id} target="_blank" rel="noreferrer" className="hover:underline">
                  ethmag/{topic?.topic_id}
                </a>
                <RefreshTopicButton topicId={topicId} />
              </div>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold w-full border-b border-b-primary pb-1 ml-1.5">Related Links</h3>
          <ul>
            {
              relevant_links?.sort((a, b) => b.clicks - a.clicks).map((link) => (
                <li key={link.url}>
                  <RelevantLink link={link} />
                </li>
              ))
            }
          </ul>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[690px] pt-8 px-2 space-y-4">
        <div>
          <h1 className="text-2xl"><b>{topic?.title}</b></h1>
          <div className='flex items-center gap-2'>
            {
              tags?.map((tag) => (
                <div key={tag} className="text-sm text-gray-500 bg-primary px-1 border border-primary">{tag}</div>
              ))
            }
          </div>
          <div className='flex items-center gap-2 justify-end'>
            <div className='flex items-center gap-1'>
              <FiEye />
              {
                formatBigNumber(topic?.view_count ?? 0)
              }
            </div>
            <div className='flex items-center gap-1'>
              <FiHeart />
              {
                formatBigNumber(topic?.like_count ?? 0)
              }
            </div>
            <div className='flex items-center gap-1'>
              <FiMessageSquare />
              {
                formatBigNumber(topic?.post_count ?? 0)
              }
            </div>
          </div>
        </div>
        <div className="space-y-8 pb-10">
          {status === 'pending' ? (
            <div>Loading...</div>
          ) : status === 'error' ? (
            <div>Error fetching posts</div>
          ) : (
            <>
              {data.pages?.map((page, i) => (
                <Fragment key={i}>
                  {page.posts?.map((post) => (
                    <TopicPost key={post.post_id} post={post} />
                  ))}
                </Fragment>
              ))}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  {isFetchingNextPage
                    ? 'Loading more...'
                    : hasNextPage
                      ? 'Load More'
                      : 'No more posts'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const RelevantLink = ({ link }: { link: RelevantLink }) => {
  let icon = undefined;

  if (link.internal) {
    icon = <LuLink />;
  }

  if (link.attachment) {
    icon = <LuPaperclip />;
  }

  if (link.reflection) {
    icon = <LuMessageCircle />;
  }

  return (
    <a href={link.url} target="_blank" rel="noreferrer" className="flex justify-between hover:bg-secondary pl-1.5 gap-3 items-center">
      <div className="w-full flex items-center gap-1 truncate">
        {icon && <div className="size-4 text-sm">{icon}</div>}
        <div className="truncate">
          {link.title || link.root_domain}
        </div>
      </div>
      <div>
        {link.clicks}
      </div>
    </a>
  );
};

const RefreshTopicButton = ({ topicId }: { topicId: string }) => {
  const { mutate: refreshTopic, isPending } = useTopicRefresh(topicId);

  return (
    <button className="text-sm text-gray-500 hover:bg-secondary p-1 group" onClick={() => refreshTopic()}>
      <LuRefreshCcw className={classNames('transition-transform duration-200 group-active:animate-spin', isPending && 'animate-spin')} />
    </button>
  );
};
