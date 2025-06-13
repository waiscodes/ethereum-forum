import { createFileRoute } from '@tanstack/react-router';

import { useWorkshopSnapshot, useWorkshopSnapshotMessages } from '@/api';

export const Route = createFileRoute('/chat/share/$snapshotId')({
    component: RouteComponent,
});

function RouteComponent() {
    const { snapshotId } = Route.useParams();
    const { data: snapshot } = useWorkshopSnapshot(snapshotId ?? '');
    const { data: messages } = useWorkshopSnapshotMessages(snapshotId ?? '');

    return (
        <div className="mx-auto prose-width mt-8">
            <div className="card">
                <div>
                    <h1>Snapshot {snapshotId}</h1>
                </div>
                <div>
                    <h2>Messages</h2>
                    <p className="whitespace-pre-wrap">
                        {JSON.stringify(snapshot, null, 2)}
                        {/* {JSON.stringify(messages, null, 2)} */}
                    </p>
                </div>
            </div>
        </div>
    );
}
