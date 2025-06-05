import { createFileRoute } from '@tanstack/react-router';

import { HardforkOverview } from '@/components/hardforks/HardforkOverview';

export const Route = createFileRoute('/r/')({
    component: RouteComponent,
    context: () => ({
        title: 'Roadmap',
    }),
});

function RouteComponent() {
    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <h1 className="">
                roadmap/<b>hardforks</b>
            </h1>
            <HardforkOverview />
            <div className="card w-full">
                <div>This page is under construction</div>
            </div>
        </div>
    );
}
