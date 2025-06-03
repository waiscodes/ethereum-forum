import { createFileRoute } from '@tanstack/react-router';

import { AgendaContent } from '@/components/agenda/AgendaContent';

export const Route = createFileRoute('/c/')({
    component: RouteComponent,
    context: () => ({
        title: 'Protocol Agenda',
    }),
});

function RouteComponent() {
    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <h1 className="">
                channel/<b>agenda</b>
            </h1>
            <AgendaContent />
        </div>
    );
}
