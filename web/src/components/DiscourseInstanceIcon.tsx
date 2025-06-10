import { SiEthereum } from 'react-icons/si';
import { match, P } from 'ts-pattern';

import { Tooltip } from './tooltip/Tooltip';

const imageMap = (discourse_id: string) => {
    if (discourse_id === 'magicians') {
        return 'https://ethereum-magicians.org/uploads/default/optimized/2X/5/5dac7cbbca817547901f15be798f33185e5453a6_2_32x32.png';
    }

    // https://ethresear.ch/uploads/default/optimized/2X/3/3483ad4ffed2ab2b130f3e81fdb188ea2c478643_2_180x180.png
    // https://ethresear.ch/uploads/default/optimized/2X/b/b5d7a1aa2f70490e3de763bef97271864784994f_2_32x32.png
    if (discourse_id === 'research') {
        return 'https://ethresear.ch/uploads/default/optimized/2X/b/b5d7a1aa2f70490e3de763bef97271864784994f_2_32x32.png';
    }

    return undefined;
};

export const DiscourseInstanceIcon = ({ discourse_id }: { discourse_id: string }) => {
    const image = imageMap(discourse_id);

    return (
        <Tooltip
            trigger={
                <div className="flex items-center gap-1 aspect-square size-4">
                    {image ? (
                        <img src={image} className="size-4 inline-block aspect-square" />
                    ) : (
                        <SiEthereum />
                    )}
                </div>
            }
        >
            {discourse_id}
        </Tooltip>
    );
};

export const DiscourseInstanceName = ({ discourse_id }: { discourse_id: string }) => {
    return (
        <div className="inline-flex items-center gap-1">
            <DiscourseInstanceIcon discourse_id={discourse_id} />
            <span
                className={match({
                    discourse_id,
                })
                    .with(
                        { discourse_id: P.union(P.string.includes('magicians')) },
                        () => 'text-purple-300'
                    )
                    .with(
                        { discourse_id: P.union(P.string.includes('research')) },
                        () => 'text-blue-300'
                    )
                    .otherwise(() => discourse_id)}
            >
                {discourse_id}
            </span>
        </div>
    );
};
