import React from 'react';
import { LuLoader, LuUser } from 'react-icons/lu';

import { useUser } from '@/api/user';
import { Tooltip } from '@/components/tooltip/Tooltip';

// User Profile Tooltip Component
export const UserProfileTooltip = ({
    username,
    children,
}: {
    username: string;
    children: React.ReactNode;
}) => {
    const { data: user, isLoading, error } = useUser(username);

    const tooltipContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 p-2">
                    <LuLoader className="animate-spin" size={16} />
                    <span>Loading...</span>
                </div>
            );
        }

        if (error || !user) {
            return (
                <div className="flex items-center gap-2 p-2 text-red-500">
                    <LuUser size={16} />
                    <span>User not found</span>
                </div>
            );
        }

        const avatarUrl = user.user.avatar_template?.replace('{size}', '40') || '';
        const fullAvatarUrl = avatarUrl.startsWith('http')
            ? avatarUrl
            : `https://ethereum-magicians.org${avatarUrl}`;

        return (
            <div className="p-3 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                    {user.user.avatar_template && (
                        <img
                            src={fullAvatarUrl}
                            alt={`${user.user.username}'s avatar`}
                            className="w-10 h-10 rounded-full"
                        />
                    )}
                    <div>
                        <div className="font-semibold">{user.user.name || user.user.username}</div>
                        <div className="text-sm text-gray-500">@{user.user.username}</div>
                    </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                    {user.user.title && (
                        <div className="font-medium text-blue-600">{user.user.title}</div>
                    )}
                    <div>Trust Level: {user.user.trust_level}</div>
                    {user.user.badge_count && user.user.badge_count > 0 && (
                        <div>
                            {user.user.badge_count} badge{user.user.badge_count !== 1 ? 's' : ''}
                        </div>
                    )}
                    {user.user.last_seen_at && (
                        <div>
                            Last seen: {new Date(user.user.last_seen_at).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return <Tooltip trigger={<span>{children}</span>}>{tooltipContent()}</Tooltip>;
};
