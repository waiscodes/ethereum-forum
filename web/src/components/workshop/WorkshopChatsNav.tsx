import { Link, useParams } from '@tanstack/react-router';
import classNames from 'classnames';

import { useAuth } from '@/api/auth';
import { useWorkshopChats } from '@/api/workshop';

import { Tooltip } from '../tooltip/Tooltip';

export const WorkshopChatsNav = () => {
    const { isAuthenticated } = useAuth();

    // Don't render anything if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Only render the component that uses the hook when authenticated
    return <AuthenticatedWorkshopChats />;
};

const AuthenticatedWorkshopChats = () => {
    const { data: chats } = useWorkshopChats();
    const { chatId } = useParams({ from: '/chat/$chatId' });

    return (
        <div className="max-h-[50vh] overflow-y-auto">
            <ul>
                {chats?.map((chat) => (
                    <li key={chat.chat_id} className="group/workshop">
                        <Link
                            to="/chat/$chatId"
                            params={{ chatId: chat.chat_id }}
                            className={classNames(
                                'flex justify-between items-center hover:bg-secondary px-1.5 py-0.5 relative',
                                chat.chat_id === chatId && 'bg-secondary'
                            )}
                        >
                            <div className="w-full">
                                <div className="absolute top-0 left-2 w-2 h-full border-l-2 border-primary group-last/workshop:h-1/2"></div>
                                <div className="absolute top-0 left-2 w-2 h-full border-primary border-b-2 -translate-y-1/2"></div>
                                <Tooltip
                                    trigger={
                                        <div className="pl-4 overflow-hidden text-ellipsis whitespace-nowrap w-full">
                                            {chat.summary || 'Untitled conversation'}
                                        </div>
                                    }
                                >
                                    {chat.summary || 'Untitled conversation'}
                                </Tooltip>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};
