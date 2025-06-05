import { Link } from '@tanstack/react-router';

import { useWorkshopChats } from '@/api/workshop';

export const WorkshopChatsNav = () => {
    const { data: chats } = useWorkshopChats();

    return (
        <div>
            <ul>
                {chats?.map((chat) => (
                    <li key={chat.chat_id} className="group/workshop">
                        <Link
                            to="/chat/$chatId"
                            params={{ chatId: chat.chat_id }}
                            className="flex justify-between items-center hover:bg-secondary px-1.5 py-0.5 relative"
                        >
                            <div>
                                <div className="absolute top-0 left-2 w-2 h-full border-l-2 border-primary group-last/workshop:h-1/2"></div>
                                <div className="absolute top-0 left-2 w-2 h-full border-primary border-b-2 -translate-y-1/2"></div>
                                <div className="pl-4">
                                    {chat.summary || 'Untitled conversation'}
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};
