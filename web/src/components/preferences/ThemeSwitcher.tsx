import classNames from 'classnames';
import { useState } from 'react';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';

export const updateTheme = () => {
    const theme = localStorage.getItem('color-theme') || 'system';

    document.documentElement.classList.remove('light', 'dark', 'system');
    document.documentElement.classList.add(theme);
};

export const ThemeSwitcher = () => {
    const theme = localStorage.getItem('color-theme') || 'system';
    const [currentTheme, setCurrentTheme] = useState(theme);
    const setTheme = (theme: string) => {
        localStorage.setItem('color-theme', theme);
        setCurrentTheme(theme);

        updateTheme();
    };

    return (
        <div className="flex h-8 gap-1 p-0.5">
            {(
                [
                    ['light', <FiSun key="light" />],
                    ['dark', <FiMoon key="dark" />],
                    ['system', <FiMonitor key="system" />],
                ] as const
            ).map(([theme, icon]) => (
                <button
                    key={theme}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setTheme(theme);
                    }}
                    className={classNames(
                        currentTheme === theme && 'bg-primary',
                        'h-full flex items-center px-1 justify-center border border-secondary aspect-square rounded-md'
                    )}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
};
