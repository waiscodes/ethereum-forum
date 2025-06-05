import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/chat/$chatId')({
    component: RouteComponent,
    context: () => ({
        title: 'Workshop',
    }),
});

function RouteComponent() {
    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <div>Welcome to the workshop!</div>
            <div className="card space-y-2">
                <p>The workshop is currently in beta and not publicly accessible yet.</p>
                <p>Please check back later.</p>
            </div>
        </div>
    );
}
