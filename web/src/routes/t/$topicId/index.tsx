import { createFileRoute } from '@tanstack/react-router';
import { Fragment } from 'react/jsx-runtime';
import { FiEye, FiHeart, FiMessageSquare } from 'react-icons/fi';
import { LuLink, LuMessageCircle, LuPaperclip } from 'react-icons/lu';

import { usePostsInfinite, useTopic } from '@/api/topics';
import { TopicPost } from '@/components/topic/TopicPost';
import { decodeCategory } from '@/util/category';

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

  return (
    <>
      <div className="right-bar">
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
        </div>
        <div className="space-y-8 pb-10">
          {status === 'pending' ? (
            <div>Loading...</div>
          ) : status === 'error' ? (
            <div>Error fetching posts</div>
          ) : (
            <>
              {data.pages.map((page, i) => (
                <Fragment key={i}>
                  {page.map((post) => (
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
