import { ReactNode } from '@tanstack/react-router';
import classNames from 'classnames';
import { FC, useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

export const ExpandableList: FC<{ title: string; children: ReactNode[]; maxItems?: number }> = ({
    title,
    children,
    maxItems = Infinity,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="space-y-1.5">
            <div className="px-1.5">
                <h3 className="font-bold w-full border-b border-b-primary pb-1">{title}</h3>
            </div>
            <ul>{children.slice(0, isExpanded ? children.length : maxItems)}</ul>
            {children.length > maxItems && (
                <button
                    className="text-sm bg-secondary text-center w-full flex items-center justify-center gap-1"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <LuChevronDown
                        className={classNames(
                            'transition-transform duration-200',
                            isExpanded && 'rotate-180'
                        )}
                    />
                    {isExpanded ? 'collapse' : 'expand'}
                    <LuChevronDown
                        className={classNames(
                            'transition-transform duration-200',
                            isExpanded && 'rotate-180'
                        )}
                    />
                </button>
            )}
        </div>
    );
};
