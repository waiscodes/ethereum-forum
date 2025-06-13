import { createFileRoute } from '@tanstack/react-router';

import { useWorkshopSnapshot } from '@/api';
import { ChatMessage } from '@/components/workshop/ChatMessage';

export const Route = createFileRoute('/chat/share/$snapshotId')({
    component: RouteComponent,
});

function RouteComponent() {
    const { snapshotId } = Route.useParams();
    const { data: snapshot } = useWorkshopSnapshot(snapshotId ?? '');

    return (
        <div className="mx-auto prose-width mt-8">
            <div>
                <h1>Snapshot {snapshotId}</h1>
            </div>
            <div>
                <ul className="space-y-4">
                    {snapshot?.messages?.map((msg) => (
                        <ChatMessage key={msg.message_id} message={msg as any} />
                    ))}
                </ul>
            </div>
        </div>
    );
}
