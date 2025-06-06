import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { handleSSOCallback, useLogin } from '@/api/auth';

export const Route = createFileRoute('/sso/$providerId/callback')({
    component: SSOCallbackComponent,
});

function SSOCallbackComponent() {
    const { providerId } = Route.useParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const navigate = useNavigate();
    const loginMutation = useLogin();
    const processedRef = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (processedRef.current) {
            return;
        }

        const handleCallback = async () => {
            processedRef.current = true;

            try {
                // Extract parameters from URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');
                const errorDescription = urlParams.get('error_description');

                // Check for OAuth errors first
                if (error) {
                    console.error('OAuth error:', error, errorDescription);
                    setErrorMessage(errorDescription || error);
                    setStatus('error');

                    return;
                }

                // Check if we have the authorization code
                if (!code) {
                    console.error('No authorization code received');
                    setErrorMessage('No authorization code received from SSO provider');
                    setStatus('error');

                    return;
                }

                console.log(
                    `Processing SSO callback for provider "${providerId}" with code:`,
                    code
                );

                // Exchange code for JWT token with backend using the dynamic provider ID
                const authResponse = await handleSSOCallback(providerId, code, state || undefined);

                console.log('Successfully authenticated user:', authResponse.user);

                // Use the login mutation to immediately update authentication state
                loginMutation.mutate({
                    token: authResponse.token,
                    user: authResponse.user,
                    expiresAt: authResponse.expires_at,
                });

                setStatus('success');
                toast.success(
                    `Welcome, ${authResponse.user.display_name || authResponse.user.username || authResponse.user.email}!`
                );
            } catch (error) {
                console.error('SSO callback error:', error);

                // Check if this is a specific API error that shouldn't cause logout
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error occurred';

                // Only show error UI, don't automatically logout since the user might still be authenticated
                setErrorMessage(errorMessage);
                setStatus('error');
                toast.error('Login failed. Please try again.');
            }
        };

        handleCallback();
    }, [providerId, loginMutation]); // Include loginMutation in dependencies

    // Handle navigation in a separate effect
    useEffect(() => {
        if (status === 'success') {
            const timeout = setTimeout(() => {
                navigate({ to: '/' });
            }, 1500);

            return () => clearTimeout(timeout);
        }
    }, [status, navigate]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <h2 className="text-xl font-semibold">Completing sign in...</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Authenticating with {providerId}...
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Sign in successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Redirecting you to the forum...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                    Sign in failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Failed to authenticate with {providerId}.{' '}
                    {errorMessage || 'An unexpected error occurred during sign in.'}
                </p>
                <button
                    onClick={() => navigate({ to: '/' })}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                    Return to Forum
                </button>
            </div>
        );
    }

    return null;
}
