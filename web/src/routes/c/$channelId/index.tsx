import { createFileRoute } from '@tanstack/react-router';

import { AgendaContent } from '@/components/agenda/AgendaContent';
import { EIPsContent } from '@/components/eips/EIPsContent';

export const Route = createFileRoute('/c/$channelId/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { channelId } = Route.useParams();

    let content = <div className="card"></div>;

    if (channelId === 'agenda') {
        content = <AgendaContent />;
    }

    if (channelId === 'eips') {
        content = <EIPsContent />;
    }

    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <h1 className="">
                channel/<b>{channelId}</b>
            </h1>
            {content}
        </div>
    );
}
