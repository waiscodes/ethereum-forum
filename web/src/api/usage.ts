import { useApi } from './api';
import type { components } from './schema.gen';

// Type definitions for convenience
export type UserUsageResponse = components['schemas']['UserUsageResponse'];
export type AdminUsageResponse = components['schemas']['AdminUsageResponse'];
export type UserUsageStats = components['schemas']['UserUsageStats'];
export type ModelUsage = components['schemas']['ModelUsage'];
export type DailyUsage = components['schemas']['DailyUsage'];
export type UserUsageOverview = components['schemas']['UserUsageOverview'];

/**
 * Get current user's usage statistics
 * @param days Number of days to get daily usage for (default: 30)
 */
export const getUserUsage = async (days?: number): Promise<UserUsageResponse> => {
    const response = await useApi('/ws/usage', 'get', {
        query: {
            ...(days && { days }),
        },
    });

    return response.data;
};

/**
 * Get admin usage overview for all users
 * @param adminKey Admin API key for authentication
 */
export const getAdminUsage = async (adminKey: string): Promise<AdminUsageResponse> => {
    const response = await fetch('/api/admin/usage', {
        method: 'GET',
        headers: {
            'X-Admin-Key': adminKey,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get admin usage: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Hook to get current user's usage with React Query
 */
export const useUserUsage = (days?: number) => {
    return {
        getUserUsage: () => getUserUsage(days),
    };
};

/**
 * Format token usage for display
 */
export const formatTokens = (tokens: number): string => {
    if (tokens >= 1_000_000) {
        return `${(tokens / 1_000_000).toFixed(1)}M`;
    } else if (tokens >= 1_000) {
        return `${(tokens / 1_000).toFixed(1)}K`;
    }

    return tokens.toString();
};

/**
 * Calculate token costs (rough estimate based on typical pricing)
 */
export const estimateCost = (
    promptTokens: number,
    completionTokens: number,
    model?: string
): number => {
    // These are rough estimates - actual pricing varies by model and provider
    const pricing: Record<string, { prompt: number; completion: number }> = {
        'google/gemini-2.5-pro-preview': { prompt: 0.00000075, completion: 0.000003 }, // $0.75/$3 per 1M tokens
        'openai/gpt-4o': { prompt: 0.000005, completion: 0.000015 }, // $5/$15 per 1M tokens
        'openai/gpt-4o-mini': { prompt: 0.00000015, completion: 0.0000006 }, // $0.15/$0.6 per 1M tokens
        'anthropic/claude-3.5-sonnet': { prompt: 0.000003, completion: 0.000015 }, // $3/$15 per 1M tokens
        default: { prompt: 0.000001, completion: 0.000002 }, // Fallback
    };

    const modelPricing = pricing[model || 'default'] || pricing.default;

    return promptTokens * modelPricing.prompt + completionTokens * modelPricing.completion;
};
