import React from 'react';
import { FiActivity } from 'react-icons/fi';

import { UsageCost } from '@/api/openrouter';

// Token Usage Bar Component
const TokenUsageBar = ({
    inputTokens,
    outputTokens,
    reasoningTokens,
}: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
}) => {
    const totalTokens = inputTokens + outputTokens + (reasoningTokens || 0);
    const inputPercentage = (inputTokens / totalTokens) * 100;
    const outputPercentage = (outputTokens / totalTokens) * 100;
    const reasoningPercentage = reasoningTokens ? (reasoningTokens / totalTokens) * 100 : 0;

    return (
        <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
            {/* Input tokens - blue */}
            <div className="flex h-full">
                <div
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${inputPercentage}%` }}
                />
                {/* Reasoning tokens - purple */}
                {(reasoningTokens && reasoningTokens > 0 && (
                    <div
                        className="h-full bg-purple-400 transition-all duration-300"
                        style={{ width: `${reasoningPercentage}%` }}
                    />
                )) ||
                    undefined}
                {/* Output tokens - green */}
                <div
                    className="h-full bg-green-400 transition-all duration-300"
                    style={{ width: `${outputPercentage}%` }}
                />
            </div>
        </div>
    );
};

interface UsageTooltipProps {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
    usageCost?: UsageCost | null;
    modelUsed?: string;
}

export const UsageTooltip: React.FC<UsageTooltipProps> = ({
    inputTokens,
    outputTokens,
    reasoningTokens = 0,
    totalTokens,
    usageCost,
    modelUsed,
}) => {
    const formatNumber = (num: number) => num.toLocaleString();

    return (
        <div className="px-4 py-1 space-y-3 max-w-sm">
            {/* Header with activity icon */}
            <div className="flex items-center gap-2 font-semibold text-sm">
                <FiActivity className="w-4 h-4 text-primary/70" />
                <span>Token Usage & Cost</span>
            </div>

            {/* Visual breakdown with bar */}
            <TokenUsageBar
                inputTokens={inputTokens}
                outputTokens={outputTokens}
                reasoningTokens={reasoningTokens}
            />

            {/* Concise breakdown */}
            <div className="space-y-2 text-xs">
                {/* Token breakdown */}
                {inputTokens > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded"></div>
                            <span>Input</span>
                        </span>
                        <div className="flex gap-3 items-center">
                            <span className="font-mono">{formatNumber(inputTokens)}</span>
                            {usageCost && (
                                <span className="text-green-600 font-mono text-xs">
                                    {usageCost.formattedPromptCost}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {outputTokens > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded"></div>
                            <span>Output</span>
                        </span>
                        <div className="flex gap-3 items-center">
                            <span className="font-mono">{formatNumber(outputTokens)}</span>
                            {usageCost && (
                                <span className="text-green-600 font-mono text-xs">
                                    {usageCost.formattedCompletionCost}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {reasoningTokens > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded"></div>
                            <span>Reasoning</span>
                        </span>
                        <div className="flex gap-3 items-center">
                            <span className="font-mono">{formatNumber(reasoningTokens)}</span>
                            {usageCost && (
                                <span className="text-green-600 font-mono text-xs">
                                    {usageCost.formattedReasoningCost}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Total */}
                <div className="border-t border-secondary pt-2 flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <div className="flex gap-3 items-center">
                        <span className="font-mono">{formatNumber(totalTokens)}</span>
                        {usageCost && (
                            <span className="text-green-600 font-mono">
                                {usageCost.formattedTotalCost}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Model information */}
            {modelUsed && (
                <div className="border-t border-secondary pt-2">
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-primary/70">Model:</span>
                        <a
                            href={`https://openrouter.ai/models/${modelUsed}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs break-all text-right link"
                        >
                            {modelUsed}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};
