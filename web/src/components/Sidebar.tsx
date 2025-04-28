import { Link } from '@tanstack/react-router';

import { ProseWidthSwitcher } from './preferences/ProseWidthSwitcher';
import { ThemeSwitcher } from './preferences/ThemeSwitcher';

export const Sidebar = () => {
    return (
        <div className="bg-primary p-4 xl:fixed space-y-2">
            <nav className="w-full xl:w-screen xl:max-w-xs space-y-1.5">
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
            <div className="px-2">
                <div className="flex items-center gap-1">
                    <span className="text-sm">Theme</span>
                    <ThemeSwitcher />
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm">Text Width</span>
                    <ProseWidthSwitcher />
                </div>
            </div>
        </div>
    );
};
