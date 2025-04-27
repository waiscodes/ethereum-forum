import { Link } from '@tanstack/react-router';

export const Navbar = () => {
    return (
        <>
            <div className="w-full bg-secondary fixed sm:relative flex justify-between items-center">
                <div className="flex items-stretch gap-2 h-full px-3">
                    <Link to="/" className="text-secondary text-base hover:underline py-2 block">
                        <span>ethereum</span>
                        <span className="text-secondary">.</span>
                        <span>forum</span>
                    </Link>
                </div>
                <div className="flex items-center h-full gap-2 flex-1 justify-end">
                    {/* <UserProfile /> */}
                </div>
            </div>
            <div className="h-12 w-full sm:hidden" />
        </>
    );
};
