import { createFileRoute, useParams } from '@tanstack/react-router';

import { useWorkshopChatMessages } from '@/api/workshop';

export const Route = createFileRoute('/chat/$chatId')({
    component: RouteComponent,
    context: () => ({
        title: 'Workshop',
    }),
});

function RouteComponent() {
    const placeholder = false;
    const { chatId } = useParams({ from: '/chat/$chatId' });

    return (
        <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
            {placeholder && <Placeholder />}
            {!placeholder && <Chat chatId={chatId} />}
        </div>
    );
}

const Placeholder = () => {
    return (
        <>
            <div>Welcome to the workshop!</div>
            <div className="card space-y-2">
                <p>The workshop is currently in beta and not publicly accessible yet.</p>
                <p>Please check back later.</p>
            </div>
        </>
    );
};

const Chat = ({ chatId }: { chatId: string }) => {
    const { data: messages } = useWorkshopChatMessages(chatId);

    return (
        <div className="w-full h-full relative py-1">
            <div className="w-full absolute inset-0">
                <div className="relative">
                    <div className="space-y-2 pb-80">
                        {messages?.map((message) => (
                            <div key={message.message_id} className="border p-4 border-primary">
                                {message.message}
                            </div>
                        ))}
                    </div>
                    <div className="w-full fixed max-w-screen-lg bottom-0 inset-x-0 mx-auto">
                        <div className="w-full relative">
                            <textarea
                                name="chatbox"
                                id="chatbox"
                                className="w-full h-full bg-primary border-primary border rounded-md p-3 focus:border-primary focus:ring-primary/50 focus:ring-2 outline-none"
                            ></textarea>
                            <button className="button button-primary absolute right-3 bottom-4">
                                Send
                            </button>
                        </div>
                        <div className="text-center text-sm py-1">
                            This is a demo. Check important info.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
