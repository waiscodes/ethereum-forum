import { Link } from '@tanstack/react-router';

import { ProseWidthSwitcher } from './preferences/ProseWidthSwitcher';
import { ThemeSwitcher } from './preferences/ThemeSwitcher';

export const Sidebar = () => {
    return (
        <div className="left-bar space-y-2">
            <div className="flex flex-col justify-between h-full">
                <nav className="w-full space-y-1.5 p-4">
                    <div className="px-1.5">
                        <p className="font-bold w-full border-b border-b-primary pb-1">
                            Navigation
                        </p>
                    </div>
                    <ul>
                        {[
                            {
                                title: 'Index',
                                href: '/',
                            },
                            {
                                title: 'Improvement Proposals',
                                short: 'EIPs',
                                href: '/c/eips',
                            },
                            {
                                title: 'Request for Comment',
                                short: 'ERCs',
                                href: '/c/ercs',
                            },
                            {
                                title: 'Working Groups',
                                href: '/c/wgs',
                            },
                            {
                                title: 'Protocol Agenda',
                                href: '/c/agenda',
                            },
                        ].map((item) => (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className="flex justify-between hover:bg-secondary px-1.5"
                                >
                                    <span>{item.title}</span>
                                    {item.short && (
                                        <span className="text-sm text-secondary text-right">
                                            {item.short}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="py-4 px-6 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">ChatGPT Assist</span>
                        <a
                            href="https://chatgpt.com/g/g-68104906afb88191ae3f52c2aff36737-ethereum-forum-assistant"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm button"
                        >
                            Open in ChatGPT
                        </a>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">Theme</span>
                        <ThemeSwitcher />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">Text Width</span>
                        <ProseWidthSwitcher />
                    </div>
                    {/* <div className="flex items-center justify-between gap-1 pr-1">
                        <span className="text-sm">Last refreshed</span>
                        <span className="text-sm">2 min ago</span>
                    </div> */}
                </div>
            </div>
        </div>
    );
};
