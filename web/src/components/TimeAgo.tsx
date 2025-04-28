import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

export const TimeAgo = ({ date }: { date: Date }) => {
    const [timeAgo, setTimeAgo] = useState(calculateTimeAgo(date));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeAgo(calculateTimeAgo(date));
        }, 1000);

        return () => clearInterval(interval);
    }, [date]);

    return <>{timeAgo}</>;
};

const calculateTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
};
