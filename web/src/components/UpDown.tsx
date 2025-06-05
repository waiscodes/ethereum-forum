import { LuArrowDown, LuArrowUp } from 'react-icons/lu';

export const UpDownScroller = () => {
    // only visible when if the document body is scrollable at all

    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;

    if (!isScrollable) return null;

    return (
        <div className="items-center gap-2 absolute right-0 top-28 hidden md:flex">
            <div className="fixed flex flex-col gap-2 items-center translate-x-full ">
                <button
                    className="text-sm hover:bg-secondary p-1 group border border-primary rounded-md"
                    onClick={() => {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }}
                >
                    <LuArrowUp />
                </button>
                <button
                    className="text-sm hover:bg-secondary p-1 group border border-primary rounded-md"
                    onClick={() => {
                        window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: 'smooth',
                        });
                    }}
                >
                    <LuArrowDown />
                </button>
            </div>
        </div>
    );
};
