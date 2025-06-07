import { createFileRoute } from '@tanstack/react-router';

import { WorkshopAuthGuard } from '@/components/AuthGuard';
import { UsageStats } from '@/components/usage/UsageStats';

export const Route = createFileRoute('/chat/usage/')({
    component: RouteComponent,
    context: () => ({
        title: 'Usage Statistics',
    }),
});

function RouteComponent() {
    return (
        <div className="mx-auto w-full max-w-6xl pt-8 px-4">
            <WorkshopAuthGuard>
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Chat Usage Statistics</h1>
                        <p className="mt-2 text-gray-600">
                            Monitor your AI chat usage, token consumption, and estimated costs
                        </p>
                    </div>

                    <UsageStats className="bg-gray-50 rounded-lg border" />
                </div>
            </WorkshopAuthGuard>
        </div>
    );
}
