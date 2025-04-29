import { Link } from '@tanstack/react-router';

import { ProseWidthSwitcher } from './preferences/ProseWidthSwitcher';
import { ThemeSwitcher } from './preferences/ThemeSwitcher';

export const Sidebar = () => {
    return (
        <div className="left-bar space-y-2">
            <div className="flex flex-col justify-between h-full max-h-[calc(100vh-32px)]">
                <nav className="w-full space-y-1.5 p-4">
                    <div className="px-1.5">
                        <p className="font-bold w-full border-b border-b-primary pb-1">Navigation</p>
                    </div>
                    <ul>
                        {
                            [
                                {
                                    title: 'Index',
                                    href: '/'
                                },
                                {
                                    title: 'Improvement Proposals',
                                    short: 'EIPs',
                                    href: '/c/eips'
                                },
                                {
                                    title: 'Request for Comment',
                                    short: 'ERCs',
                                    href: '/c/ercs'
                                },
                                {
                                    title: 'Working Groups',
                                    href: '/c/wgs'
                                },
                                {
                                    title: 'Protocol Agenda',
                                    href: '/c/agenda'
                                }
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link to={item.href} className="flex justify-between hover:bg-secondary px-1.5">
                                        <span>
                                            {item.title}
                                        </span>
                                        {
                                            item.short && (
                                                <span className="text-sm text-secondary text-right">
                                                    {item.short}
                                                </span>
                                            )
                                        }
                                    </Link>
                                </li>
                            ))
                        }
                    </ul>
                </nav>
                <div className="py-4 px-6">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">Theme</span>
                        <ThemeSwitcher />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm">Text Width</span>
                        <ProseWidthSwitcher />
                    </div>
                </div>
            </div>
        </div>
    );
};
