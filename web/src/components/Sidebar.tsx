import { Link } from '@tanstack/react-router';
import { GrWorkshop } from 'react-icons/gr';
import { SiOpenai } from 'react-icons/si';

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
                    <ul className="overflow-hidden">
                        {[
                            {
                                title: 'Index',
                                href: '/',
                                short: 'Everything',
                            },
                            // {
                            //     title: 'Improvement Proposals',
                            //     short: 'EIPs',
                            //     href: '/c/eips',
                            // },
                            // {
                            //     title: 'Request for Comment',
                            //     short: 'ERCs',
                            //     href: '/c/ercs',
                            // },
                            // {
                            //     title: 'Working Groups',
                            //     href: '/c/wgs',
                            // },
                            {
                                title: 'Roadmap',
                                href: '/r',
                                short: 'Hardforks',
                            },
                            {
                                title: 'Standards',
                                href: '/s',
                                short: 'EIPs & ERCs',
                            },
                            {
                                title: 'Protocol Agenda',
                                href: '/c',
                                short: 'Calendar',
                            },
                            {
                                title: 'Workshop',
                                href: '/chat/new',
                            },
                        ].map((item) => (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className="flex justify-between items-center hover:bg-secondary px-1.5 py-0.5 relative"
                                >
                                    <div>
                                        <div className="absolute top-0 left-2 w-2 h-full border-l-2 border-primary border-b-2 -translate-y-1/2"></div>
                                        <span className="pl-4">{item.title}</span>
                                    </div>
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
                        <span className="text-sm">Explore</span>
                        <div className="flex items-center gap-1">
                            <a
                                href="/chat/new"
                                className="text-sm button flex items-center justify-center gap-1"
                            >
                                <GrWorkshop />
                                Open Workshop
                            </a>
                            <a
                                href="https://chatgpt.com/g/g-68104906afb88191ae3f52c2aff36737-ethereum-forum-assistant"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm button aspect-square size-7 flex items-center justify-center"
                            >
                                <SiOpenai />
                            </a>
                        </div>
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
