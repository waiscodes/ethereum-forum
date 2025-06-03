import { createFileRoute } from '@tanstack/react-router';

import { EIPsContent } from '@/components/eips/EIPsContent';

export const Route = createFileRoute('/s/')({
    component: RouteComponent,
    context: () => ({
        title: 'Standards',
    }),
});

function RouteComponent() {
    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <h1 className="">
                standards/<b>overview</b>
            </h1>
            <EIPsContent />
        </div>
    );
}
