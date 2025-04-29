import { FC } from 'react';
import { LuCalendar } from 'react-icons/lu';

import { Meetings } from './Meetings';

export const AgendaContent: FC = () => {

    return (
        <>
            <div className="card">
                <div className="flex justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Protocol Agenda</h2>
                        <p>
                            the protocol agenda is a shared calendar that includes all meetings and live streams around the protocol.
                        </p>
                        <p>
                            See also <a href="https://github.com/ethereum/pm/issues" target="_blank" rel="noreferrer" className="link">github.com/ethereum/pm/issues</a>
                        </p>
                    </div>
                    <div>
                        <a href="https://calendar.google.com/calendar/u/0?cid=Y191cGFvZm9uZzhtZ3JtcmtlZ243aWM3aGs1c0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t" target="_blank" className="button px-1 flex items-center gap-1" rel="noreferrer">
                            <LuCalendar />
                            <span>
                                Add to calendar
                            </span>
                        </a>
                    </div>
                </div>
            </div>
            <Meetings />
        </>
    );
};