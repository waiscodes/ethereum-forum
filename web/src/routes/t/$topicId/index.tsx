import { createFileRoute } from '@tanstack/react-router';
import { Fragment } from 'react/jsx-runtime';

import { usePostsInfinite } from '@/api/topics';
import { TopicPost } from '@/components/topic/TopicPost';

export const Route = createFileRoute('/t/$topicId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { topicId } = Route.useParams();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = usePostsInfinite(topicId);

  return (
    <div className="mx-auto w-full max-w-[690px] pt-8 px-2 space-y-4">
      <h1 className="">topic/<b>{topicId}</b></h1>
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
  );
}
