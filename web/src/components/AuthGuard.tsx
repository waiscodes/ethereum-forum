import { ReactNode } from 'react';
import { FiCode, FiCopy, FiLock, FiMessageSquare, FiSearch, FiUser } from 'react-icons/fi';
import { toast } from 'sonner';

import { getSSOLoginUrl, useAuth, useSSOProviders } from '../api/auth';

interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
    requireAuth?: boolean;
}

export const WorkshopAuthGuard = ({ children, fallback, requireAuth = true }: AuthGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (!requireAuth || isAuthenticated) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2 text-primary">
                    <FiUser size={16} className="animate-pulse" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return <>{fallback || <WorkshopPreviewFallback />}</>;
};

// Standard auth guard for general features
export const AuthGuard = ({ children, fallback, requireAuth = true }: AuthGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (!requireAuth || isAuthenticated) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2 text-primary">
                    <FiUser size={16} className="animate-pulse" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return <>{fallback || <AuthRequiredFallback />}</>;
};

const WorkshopPreviewFallback = () => {
    const { data: providersData, isLoading, error } = useSSOProviders();
    const mcpEndpoint = `${window.location.origin}/mcp`;

    const handleProviderClick = async (providerId: string) => {
        try {
            const response = await getSSOLoginUrl(providerId);

            window.location.href = response.redirect_url;
        } catch (error) {
            console.error('Failed to get login URL:', error);
        }
    };

    const copyMcpEndpoint = async () => {
        try {
            await navigator.clipboard.writeText(mcpEndpoint);
            toast.success('MCP endpoint copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toast.error('Failed to copy to clipboard');
        }
    };

    const mcpTools = [
        {
            name: 'get_posts',
            description: 'Retrieve posts from a topic with pagination',
            params: 'topic_id, page, size',
        },
        {
            name: 'get_topic_summary',
            description: 'Get a comprehensive summary of a topic',
            params: 'topic_id',
        },
        {
            name: 'search_posts',
            description: 'Search through forum posts and discussions',
            params: 'query, filters',
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 text-3xl font-bold text-primary">
                        <FiCode size={32} />
                        <span>Workshop Preview</span>
                    </div>
                    <p className="text-lg text-primary/80 max-w-2xl mx-auto">
                        The workshop feature is currently in preview mode and requires
                        authentication. However, you can explore our powerful MCP (Model Context
                        Protocol) tools!
                    </p>
                </div>

                {/* MCP Endpoint Showcase */}
                <div className="card !p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-semibold text-primary flex items-center justify-center gap-2">
                            <FiMessageSquare size={24} />
                            MCP Integration Available
                        </h2>
                        <p className="text-primary/80">
                            Connect to our forum data using the Model Context Protocol
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 max-w-2xl mx-auto">
                            <div className="flex-1 bg-secondary/50 rounded-lg p-3 border border-primary/20">
                                <code className="text-primary font-mono text-sm break-all">
                                    {mcpEndpoint}
                                </code>
                            </div>
                            <button
                                onClick={copyMcpEndpoint}
                                className="flex items-center gap-2 button !py-3 !px-4"
                                title="Copy MCP endpoint"
                            >
                                <FiCopy size={16} />
                                Copy
                            </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                            {mcpTools.map((tool) => (
                                <div
                                    key={tool.name}
                                    className="bg-secondary/30 rounded-lg p-4 border border-primary/10"
                                >
                                    <div className="flex items-start gap-2">
                                        <FiSearch
                                            size={16}
                                            className="text-primary/60 mt-1 flex-shrink-0"
                                        />
                                        <div className="space-y-1">
                                            <h3 className="font-mono text-sm font-semibold text-primary">
                                                {tool.name}
                                            </h3>
                                            <p className="text-xs text-primary/70">
                                                {tool.description}
                                            </p>
                                            <p className="text-xs text-primary/50 pt-2 font-mono">
                                                Params: {tool.params}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Authentication Section */}
                <div className="w-fit ml-auto">
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <FiUser size={16} className="animate-pulse" />
                                <span>Loading sign-in options...</span>
                            </div>
                        ) : error || !providersData?.providers?.length ? (
                            <div className="text-primary">
                                <p>Sign-in is currently unavailable. Please try again later.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    {providersData.providers.map((providerId) => (
                                        <button
                                            key={providerId}
                                            onClick={() => handleProviderClick(providerId)}
                                            className="button flex items-center gap-2"
                                        >
                                            <FiUser size={16} />
                                            <span className="capitalize">
                                                Sign in with {providerId}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuthRequiredFallback = () => {
    const { data: providersData, isLoading, error } = useSSOProviders();

    const handleProviderClick = async (providerId: string) => {
        try {
            const response = await getSSOLoginUrl(providerId);

            window.location.href = response.redirect_url;
        } catch (error) {
            console.error('Failed to get login URL:', error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <div className="flex items-center gap-3 text-xl font-semibold text-primary">
                <FiLock size={24} />
                <span>Authentication Required</span>
            </div>

            <p className="text-primary max-w-md">
                This feature requires you to be signed in. Please choose a sign-in method below to
                continue.
            </p>

            {isLoading ? (
                <div className="flex items-center gap-2 text-primary">
                    <FiUser size={16} className="animate-pulse" />
                    <span>Loading sign-in options...</span>
                </div>
            ) : error || !providersData?.providers?.length ? (
                <div className="text-primary">
                    <p>Sign-in is currently unavailable. Please try again later.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-primary font-medium">Choose a sign-in method:</p>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        {providersData.providers.map((providerId) => (
                            <button
                                key={providerId}
                                onClick={() => handleProviderClick(providerId)}
                                className="flex items-center gap-2 px-4 py-3 bg-secondary text-primary border border-primary rounded-md hover:bg-tertiary transition-colors"
                            >
                                <FiUser size={16} />
                                <span className="capitalize">Sign in with {providerId}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
