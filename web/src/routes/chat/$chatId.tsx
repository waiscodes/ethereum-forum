import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/chat/$chatId')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            <div>Welcome to the workshop!</div>
        </div>
    );
}
