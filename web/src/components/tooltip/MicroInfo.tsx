import { FC, PropsWithChildren } from 'react';
import { TiInfoLarge } from 'react-icons/ti';

import { Tooltip } from './Tooltip';

export const MicroInfo: FC<PropsWithChildren> = ({ children }) => {
    return (
        <Tooltip
            trigger={
                <button className="p-1 hover:bg-secondary rounded-sm text-sm">
                    <TiInfoLarge className="text-primary/80" />
                </button>
            }
        >
            {children}
        </Tooltip>
    );
};
