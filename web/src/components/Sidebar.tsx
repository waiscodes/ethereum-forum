import { Link } from '@tanstack/react-router';

export const Sidebar = () => {
    return (
        <div className="bg-primary p-4 xl:fixed">
            <nav className="w-full xl:w-screen xl:max-w-xs space-y-2">
                <p className="font-bold w-full border-b-2 border-b-primary pb-1">Navigation</p>
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
                                <Link to={item.href} className="flex justify-between hover:bg-secondary px-2 py-0.5">
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
        </div>
    );
};
