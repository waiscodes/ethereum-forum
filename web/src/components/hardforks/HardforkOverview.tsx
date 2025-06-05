import { Tooltip } from '../tooltip/Tooltip';

type Hardfork = {
    name: string;
    date?: string;
    description?: string;
};

const consensusLayer: Hardfork[] = [
    {
        name: 'Beacon Chain Launch',
    },
    {
        name: 'Altair',
    },
    {
        name: 'Bellatrix',
    },
];

const execLayer: Hardfork[] = [
    {
        name: 'Frontier',
    },
    {
        name: 'Homestead',
    },
    {
        name: 'DAO fork',
    },
    {
        name: 'Byzantium',
    },
    {
        name: 'Istanbul',
    },
    {
        name: 'Berlin',
    },
    {
        name: 'Arrow Glacier',
    },
    {
        name: 'Gray Glacier',
    },
];

const postMerge: Hardfork[] = [
    {
        name: 'Merge (Bellatrix / Paris)',
        date: '2022-09-15',
    },
    {
        name: 'Shapella (Capella / Shanghai)',
        date: '2023-04-12',
    },
    {
        name: 'Dencun (Deneb / Cancun)',
        date: '2024-03-13',
    },
    {
        name: 'Pectra (Electra / Prague)',
        date: '2025-05-07',
    },
];

const future: Hardfork[] = [
    {
        name: 'Fusaka (Fulu / Osaka)',
        date: 'Q3 2025 - Q1 2026',
    },
    {
        name: 'Glamsterdam (Gloas / Amsterdam)',
        date: '2026',
    },
];

export const HardforkOverview = () => {
    return (
        <>
            <h2 className="font-bold border-b border-primary">Hardfork Overview</h2>
            <div className="card overflow-x-auto">
                <div className="px-4 w-fit">
                    <div className="flex items-center h-full justify-center w-full">
                        <div className="w-fit space-y-3.5 py-[18px]">
                            <div className="flex justify-end">
                                {consensusLayer.map((hardfork) => (
                                    <div
                                        key={hardfork.name}
                                        className="border-b-2 -translate-y-1/2 px-2 first:pl-0 border-yellow-400"
                                    >
                                        <Tooltip
                                            trigger={
                                                <div className="size-6 bg-[#36B9FF] rounded-sm translate-y-1/2"></div>
                                            }
                                        >
                                            <div className="whitespace-nowrap">{hardfork.name}</div>
                                        </Tooltip>
                                    </div>
                                ))}
                            </div>
                            <div className="flex">
                                {execLayer.map((hardfork) => (
                                    <div
                                        key={hardfork.name}
                                        className="border-b-2 px-2 first:pl-0 border-yellow-400 -translate-y-1/2"
                                    >
                                        <Tooltip
                                            trigger={
                                                <div className="size-6 bg-[#B38BFC] rounded-sm translate-y-1/2"></div>
                                            }
                                        >
                                            <div className="whitespace-nowrap">{hardfork.name}</div>
                                        </Tooltip>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-full flex items-center">
                            <svg
                                width="200"
                                height="104"
                                viewBox="0 0 200 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-yellow-400"
                            >
                                <path
                                    d="M0 30 C 50 30, 100 50, 150 50"
                                    stroke="currentColor"
                                    fill="transparent"
                                    strokeWidth="2"
                                />

                                <path
                                    d="M0 70 C 50 70, 100 50, 150 50"
                                    stroke="currentColor"
                                    fill="transparent"
                                    strokeWidth="2"
                                />

                                <line
                                    x1="150"
                                    y1="50"
                                    x2="200"
                                    y2="50"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                        <div className="h-full justify-self-stretch">
                            <div className="flex items-center">
                                {postMerge.map((hardfork) => (
                                    <div
                                        key={hardfork.name}
                                        className="px-2 first:pl-0 relative z-10"
                                    >
                                        <Tooltip
                                            trigger={
                                                <div className="size-6 bg-[#3C3D42] rounded-sm z-10"></div>
                                            }
                                        >
                                            <div className="whitespace-nowrap">{hardfork.name}</div>
                                        </Tooltip>
                                        <div className="border-b-4 px-2 first:pl-0 border-yellow-400 absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-full justify-self-stretch">
                            <div className="flex items-center">
                                {future.map((hardfork) => (
                                    <div
                                        key={hardfork.name}
                                        className="px-2 first:pl-0 relative z-10"
                                    >
                                        <Tooltip
                                            trigger={
                                                <div className="size-6 bg-[#3C3D42] rounded-sm z-10"></div>
                                            }
                                        >
                                            <div className="whitespace-nowrap">{hardfork.name}</div>
                                        </Tooltip>
                                        <div className="border-b-4 px-2 first:pl-0 border-yellow-200 border-dashed absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {execLayer.map((hardfork) => (
                        <div key={hardfork.name} className="card !border-[#B38BFC] border-2">
                            <div className="flex items-center gap-2">
                                <div className="size-6 bg-[#B38BFC] rounded-sm"></div>
                                <div className="font-bold">{hardfork.name}</div>
                            </div>
                            <div>{hardfork.date}</div>
                            <div>{hardfork.description}</div>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    {consensusLayer.map((hardfork) => (
                        <div key={hardfork.name} className="card !border-[#36B9FF] border-2">
                            <div className="flex items-center gap-2">
                                <div className="size-6 bg-[#36B9FF] rounded-sm"></div>
                                <div className="font-bold">{hardfork.name}</div>
                            </div>
                            <div>{hardfork.date}</div>
                            <div>{hardfork.description}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postMerge.map((hardfork) => (
                    <div key={hardfork.name} className="card !border-[#3C3D42] border-2">
                        <div className="flex items-center gap-2">
                            <div className="size-6 bg-[#3C3D42] rounded-sm"></div>
                            <div className="font-bold">{hardfork.name}</div>
                        </div>
                        <div>{hardfork.date}</div>
                        <div>{hardfork.description}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {future.map((hardfork) => (
                    <div key={hardfork.name} className="card !border-[#FFD700] border-2">
                        <div className="flex items-center gap-2">
                            <div className="size-6 bg-[#FFD700] rounded-sm"></div>
                            <div className="font-bold">{hardfork.name}</div>
                        </div>
                        <div>{hardfork.date}</div>
                        <div>{hardfork.description}</div>
                    </div>
                ))}
            </div>
        </>
    );
};
