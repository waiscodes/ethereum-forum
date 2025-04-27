import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/c/$channelId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { channelId } = Route.useParams();

  return (
    <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
      <h1 className="">channel/<b>{channelId}</b></h1>
      <div className="card">
      </div>
    </div>
  );
}
