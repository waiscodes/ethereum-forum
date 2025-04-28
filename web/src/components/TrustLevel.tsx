import { FC } from 'react';

export const TrustLevel: FC<{ trustLevel: number }> = ({ trustLevel }) => {
    return (
        <div className="text-xs py-0.5 text-gray-500 bg-secondary rounded-full px-1.5">
            {trustLevel}
        </div>
    );
};