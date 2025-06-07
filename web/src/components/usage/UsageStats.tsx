import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { DailyUsage, ModelUsage, UserUsageStats } from '../../api/usage';
import { estimateCost, formatTokens, getUserUsage } from '../../api/usage';

interface UsageStatsProps {
    className?: string;
}

export const UsageStats = ({ className }: UsageStatsProps) => {
    const [days, setDays] = useState(30);

    const {
        data: usage,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['userUsage', days],
        queryFn: () => getUserUsage(days),
    });

    if (isLoading) {
        return (
            <div className={className}>
                <div className="animate-pulse">
                    <div className="h-4 bg-primary/20 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-primary/20 rounded"></div>
                        <div className="h-3 bg-primary/20 rounded w-5/6"></div>
                        <div className="h-3 bg-primary/20 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-4 ${className}`}>
                <div className="text-error">Error loading usage statistics: {error.message}</div>
            </div>
        );
    }

    if (!usage) {
        return null;
    }

    const { stats, by_model, daily_usage } = usage;

    return (
        <div className={`p-6 space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">Usage Statistics</h2>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="px-3 py-1 border-secondary border rounded-md bg-primary text-secondary"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Overall Stats */}
            <OverallStats stats={stats} />

            {/* Usage Trend Graph */}
            <UsageTrendGraph dailyUsage={daily_usage} />

            {/* Usage by Model */}
            <ModelUsageSection models={by_model} />

            {/* Daily Usage Chart */}
            <DailyUsageSection dailyUsage={daily_usage} />
        </div>
    );
};

interface OverallStatsProps {
    stats: UserUsageStats;
}

const OverallStats = ({ stats }: OverallStatsProps) => {
    const estimatedCost = estimateCost(stats.total_prompt_tokens, stats.total_completion_tokens);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Messages"
                value={stats.message_count.toString()}
                subtitle="AI responses generated"
            />
            <StatCard
                title="Total Tokens"
                value={formatTokens(stats.total_tokens)}
                subtitle={`${formatTokens(stats.total_prompt_tokens)} input + ${formatTokens(stats.total_completion_tokens)} output`}
            />
            <StatCard
                title="Reasoning Tokens"
                value={formatTokens(stats.total_reasoning_tokens)}
                subtitle="Advanced reasoning usage"
            />
            <StatCard
                title="Estimated Cost"
                value={`$${estimatedCost.toFixed(4)}`}
                subtitle="Approximate total cost"
            />
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
}

const StatCard = ({ title, value, subtitle }: StatCardProps) => (
    <div className="bg-primary p-4 rounded-lg border-secondary border shadow-sm">
        <h3 className="text-sm font-medium text-primary/70 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-primary/50">{subtitle}</p>
    </div>
);

interface UsageTrendGraphProps {
    dailyUsage: DailyUsage[];
}

const UsageTrendGraph = ({ dailyUsage }: UsageTrendGraphProps) => {
    const last7Days = dailyUsage.slice(0, 7).reverse(); // Show last 7 days, oldest first

    if (last7Days.length === 0) {
        return null;
    }

    const maxTokens = Math.max(...last7Days.map((day) => day.total_tokens));
    const maxMessages = Math.max(...last7Days.map((day) => day.message_count));

    // Normalize values for chart (0-100 scale)
    const normalizeTokens = (tokens: number) => (maxTokens > 0 ? (tokens / maxTokens) * 100 : 0);
    const normalizeMessages = (messages: number) =>
        maxMessages > 0 ? (messages / maxMessages) * 100 : 0;

    return (
        <div className="bg-primary p-6 rounded-lg border-secondary border">
            <h3 className="text-lg font-semibold mb-4 text-primary">Usage Trend (Last 7 Days)</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Token Usage Chart */}
                <div>
                    <h4 className="text-sm font-medium text-primary/70 mb-3">Daily Token Usage</h4>
                    <div className="relative h-32 bg-secondary/50 rounded-lg p-4">
                        <svg className="w-full h-full" viewBox="0 0 280 80">
                            {/* Grid lines */}
                            <defs>
                                <pattern
                                    id="grid"
                                    width="40"
                                    height="20"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 40 0 L 0 0 0 20"
                                        fill="none"
                                        stroke="rgb(var(--theme-text-primary))"
                                        strokeOpacity="0.1"
                                        strokeWidth="0.5"
                                    />
                                </pattern>
                            </defs>
                            <rect width="280" height="80" fill="url(#grid)" />

                            {/* Token usage bars */}
                            {last7Days.map((day, index) => {
                                const barHeight = (normalizeTokens(day.total_tokens) / 100) * 60;
                                const x = index * 40 + 10;

                                return (
                                    <g key={day.date}>
                                        <rect
                                            x={x}
                                            y={70 - barHeight}
                                            width="20"
                                            height={barHeight}
                                            fill="rgb(var(--theme-text-secondary))"
                                            rx="2"
                                            className="opacity-80 hover:opacity-100 transition-opacity"
                                        />
                                        <text
                                            x={x + 10}
                                            y={76}
                                            textAnchor="middle"
                                            className="text-xs fill-current text-primary/60"
                                        >
                                            {day.date.slice(-2)}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <div className="mt-2 text-xs text-primary/50 text-center">
                        Peak: {formatTokens(maxTokens)} tokens
                    </div>
                </div>

                {/* Message Count Chart */}
                <div>
                    <h4 className="text-sm font-medium text-primary/70 mb-3">
                        Daily Message Count
                    </h4>
                    <div className="relative h-32 bg-secondary/50 rounded-lg p-4">
                        <svg className="w-full h-full" viewBox="0 0 280 80">
                            <rect width="280" height="80" fill="url(#grid)" />

                            {/* Message count line chart */}
                            <polyline
                                fill="none"
                                stroke="rgb(var(--theme-text-secondary))"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={last7Days
                                    .map((day, index) => {
                                        const x = index * 40 + 20;
                                        const y =
                                            70 - (normalizeMessages(day.message_count) / 100) * 60;

                                        return `${x},${y}`;
                                    })
                                    .join(' ')}
                                className="opacity-80"
                            />

                            {/* Data points */}
                            {last7Days.map((day, index) => {
                                const x = index * 40 + 20;
                                const y = 70 - (normalizeMessages(day.message_count) / 100) * 60;

                                return (
                                    <g key={`point-${day.date}`}>
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="3"
                                            fill="rgb(var(--theme-text-secondary))"
                                            className="hover:r-4 transition-all"
                                        />
                                        <text
                                            x={x}
                                            y={76}
                                            textAnchor="middle"
                                            className="text-xs fill-current text-primary/60"
                                        >
                                            {day.date.slice(-2)}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <div className="mt-2 text-xs text-primary/50 text-center">
                        Peak: {maxMessages} messages
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ModelUsageSectionProps {
    models: ModelUsage[];
}

const ModelUsageSection = ({ models }: ModelUsageSectionProps) => (
    <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Usage by Model</h3>
        <div className="space-y-3">
            {models.map((model) => (
                <div
                    key={model.model_name}
                    className="bg-primary p-4 rounded-lg border-secondary border"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-primary">{model.model_name}</h4>
                        <span className="text-sm text-primary/70">
                            {model.message_count} messages
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-primary/70">Input:</span>{' '}
                            <span className="text-primary">
                                {formatTokens(model.prompt_tokens)}
                            </span>
                        </div>
                        <div>
                            <span className="text-primary/70">Output:</span>{' '}
                            <span className="text-primary">
                                {formatTokens(model.completion_tokens)}
                            </span>
                        </div>
                        <div>
                            <span className="text-primary/70">Total:</span>{' '}
                            <span className="text-primary">{formatTokens(model.total_tokens)}</span>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-primary/50">
                        Est. cost: $
                        {estimateCost(
                            model.prompt_tokens,
                            model.completion_tokens,
                            model.model_name
                        ).toFixed(4)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

interface DailyUsageSectionProps {
    dailyUsage: DailyUsage[];
}

const DailyUsageSection = ({ dailyUsage }: DailyUsageSectionProps) => (
    <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Daily Usage Details</h3>
        <div className="bg-primary p-4 rounded-lg border-secondary border">
            <div className="space-y-2">
                {dailyUsage.slice(0, 10).map((day) => (
                    <div key={day.date} className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-primary">{day.date}</span>
                        <div className="flex space-x-4 text-sm text-primary/70">
                            <span>{day.message_count} msgs</span>
                            <span>{formatTokens(day.total_tokens)} tokens</span>
                            <span>
                                ${estimateCost(day.prompt_tokens, day.completion_tokens).toFixed(4)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
