import classNames from 'classnames';
import { useState } from 'react';
import { FiAlignJustify, FiList, FiMaximize2, FiMenu } from 'react-icons/fi';

export const updateProseWidth = () => {
    const proseWidth = localStorage.getItem('prose-width') || 'prose-normal';

    document.documentElement.classList.remove('prose-normal', 'prose-wide');
    document.documentElement.classList.add(proseWidth);
};

export const ProseWidthSwitcher = () => {
    const proseWidth = localStorage.getItem('prose-width') || 'prose-normal';
    const [currentProseWidth, setCurrentProseWidth] = useState(proseWidth);
    const setProseWidth = (proseWidth: string) => {
        localStorage.setItem('prose-width', proseWidth);
        setCurrentProseWidth(proseWidth);

        updateProseWidth();
    };

    return (
        <div className="flex h-8 gap-1 p-0.5">
            {(
                [
                    ['prose-normal', <FiList key="prose-normal" />],
                    ['prose-wide', <FiMenu key="prose-wide" />],
                ] as const
            ).map(([proseWidth, icon]) => (
                <button
                    key={proseWidth}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setProseWidth(proseWidth);
                    }}
                    className={classNames(
                        currentProseWidth === proseWidth && 'bg-primary',
                        'h-full flex items-center px-1 justify-center border border-secondary aspect-square rounded-md'
                    )}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
};
