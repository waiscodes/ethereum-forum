import classNames from 'classnames';
import { useState } from 'react';
import { FiChevronDown, FiLogIn, FiUser } from 'react-icons/fi';

import { getSSOLoginUrl, useSSOProviders } from '../api/auth';

export const LoginButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: providersData, isLoading, error } = useSSOProviders();

    const handleProviderClick = async (providerId: string) => {
        try {
            const response = await getSSOLoginUrl(providerId);

            window.location.href = response.redirect_url;
        } catch (error) {
            console.error('Failed to get login URL:', error);
        }

        setIsOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 text-sm text-primary">
                <FiUser size={16} />
                Loading...
            </div>
        );
    }

    if (error || !providersData?.providers?.length) {
        return null; // Don't show login button if no providers available
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={classNames(
                    'flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-secondary',
                    'border border-secondary',
                    isOpen && 'bg-secondary'
                )}
            >
                <FiLogIn size={16} />
                <span>Sign In</span>
                <FiChevronDown
                    size={14}
                    className={classNames('transition-transform', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] bg-primary border border-primary rounded-md shadow-lg">
                        <div className="py-1">
                            <div className="px-3 py-2 text-xs font-medium text-primary border-b border-secondary">
                                Sign in with
                            </div>
                            {providersData.providers.map((providerId) => (
                                <button
                                    key={providerId}
                                    onClick={() => handleProviderClick(providerId)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                                >
                                    <FiUser size={16} />
                                    <span className="capitalize">{providerId}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
