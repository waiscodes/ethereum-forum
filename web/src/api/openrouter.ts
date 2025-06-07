import { useQuery } from '@tanstack/react-query';

// OpenRouter API types
export interface OpenRouterPricing {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    web_search: string;
    internal_reasoning: string;
    input_cache_read: string;
    input_cache_write: string;
    discount: number;
}

export interface OpenRouterEndpoint {
    name: string;
    context_length: number;
    pricing: OpenRouterPricing;
    provider_name: string;
    tag: string;
    quantization: string | null;
    max_completion_tokens: number;
    max_prompt_tokens: number | null;
    supported_parameters: string[];
    status: number;
}

export interface OpenRouterModelResponse {
    data: {
        id: string;
        name: string;
        created: number;
        description: string;
        architecture: {
            tokenizer: string;
            instruct_type: string | null;
            modality: string;
            input_modalities: string[];
            output_modalities: string[];
        };
        endpoints: OpenRouterEndpoint[];
    };
}

// Fetch OpenRouter model endpoints
const fetchOpenRouterModelEndpoints = async (modelId: string): Promise<OpenRouterModelResponse> => {
    const response = await fetch(`https://openrouter.ai/api/v1/models/${modelId}/endpoints`);

    if (!response.ok) {
        throw new Error(`Failed to fetch model endpoints: ${response.statusText}`);
    }

    return response.json();
};

// Hook to fetch OpenRouter model data
export const useOpenRouterModel = (modelId: string) => {
    return useQuery({
        queryKey: ['openrouter-model', modelId],
        queryFn: () => fetchOpenRouterModelEndpoints(modelId),
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: !!modelId,
    });
};

// Types for usage calculation
export interface TokenUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
    reasoning_tokens?: number;
    total_tokens: number;
}

export interface UsageCost {
    promptCost: bigint;
    completionCost: bigint;
    reasoningCost: bigint;
    totalCost: bigint;
    formattedPromptCost: string;
    formattedCompletionCost: string;
    formattedReasoningCost: string;
    formattedTotalCost: string;
    currency: string;
}

// Convert decimal string to bigint (preserving precision)
const decimalToBigInt = (decimalStr: string, precision: number = 8): bigint => {
    if (!decimalStr || decimalStr === '0') return 0n;

    // Remove any existing decimal point and pad with zeros
    const [integer, fractional = ''] = decimalStr.split('.');
    const paddedFractional = fractional.padEnd(precision, '0').slice(0, precision);
    const fullNumberStr = integer + paddedFractional;

    return BigInt(fullNumberStr);
};

// Format bigint to dollar string
const formatBigIntToDollars = (value: bigint, precision: number = 8): string => {
    if (value === 0n) return '$0.00';

    const valueStr = value.toString().padStart(precision + 1, '0');
    const integer = valueStr.slice(0, -precision) || '0';
    const fractional = valueStr.slice(-precision);

    // Find the first non-zero digit for smart rounding
    const firstNonZero = fractional.search(/[1-9]/);

    if (firstNonZero === -1) {
        return `$${integer}.00`;
    }

    // For very small amounts, show more precision
    if (integer === '0' && firstNonZero >= 2) {
        const significantDigits = fractional.slice(firstNonZero, firstNonZero + 3);

        return `$0.${'0'.repeat(firstNonZero)}${significantDigits}`;
    }

    // For regular amounts, show 2-4 decimal places
    const rounded = fractional.slice(0, 4);
    const trimmed = rounded.replace(/0+$/, '').padEnd(2, '0');

    return `$${integer}.${trimmed}`;
};

// Hook to calculate usage costs
export const useUsageCost = (
    tokenUsage: TokenUsage,
    modelId?: string,
    endpointTag?: string
): UsageCost | null => {
    const { data: modelData } = useOpenRouterModel(modelId || '');

    if (!modelData || !tokenUsage) {
        return null;
    }

    // Find the appropriate endpoint
    const endpoint = endpointTag
        ? modelData.data.endpoints.find((e) => e.tag === endpointTag)
        : modelData.data.endpoints[0]; // Default to first endpoint

    if (!endpoint) {
        return null;
    }

    const precision = 8; // 8 decimal places for precision

    // Convert pricing to bigint (prices are per token)
    const promptPriceBigInt = decimalToBigInt(endpoint.pricing.prompt, precision);
    const completionPriceBigInt = decimalToBigInt(endpoint.pricing.completion, precision);
    const reasoningPriceBigInt = decimalToBigInt(endpoint.pricing.internal_reasoning, precision);

    // Calculate costs
    const promptCost = promptPriceBigInt * BigInt(tokenUsage.prompt_tokens || 0);
    const completionCost = completionPriceBigInt * BigInt(tokenUsage.completion_tokens || 0);
    const reasoningCost = reasoningPriceBigInt * BigInt(tokenUsage.reasoning_tokens || 0);
    const totalCost = promptCost + completionCost + reasoningCost;

    return {
        promptCost,
        completionCost,
        reasoningCost,
        totalCost,
        formattedPromptCost: formatBigIntToDollars(promptCost, precision),
        formattedCompletionCost: formatBigIntToDollars(completionCost, precision),
        formattedReasoningCost: formatBigIntToDollars(reasoningCost, precision),
        formattedTotalCost: formatBigIntToDollars(totalCost, precision),
        currency: 'USD',
    };
};

// Utility hook for extracting model ID from model_used field
export const extractModelId = (modelUsed?: string): string | undefined => {
    if (!modelUsed) return undefined;

    // Handle various model format patterns
    // e.g., "google/gemini-2.5-pro-preview", "openai/gpt-4", etc.
    const match = modelUsed.match(/^([^/]+\/[^/]+)/);

    return match ? match[1] : modelUsed;
};
