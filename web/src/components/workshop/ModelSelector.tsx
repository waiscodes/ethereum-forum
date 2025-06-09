import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { LuBot, LuCheck, LuChevronDown } from 'react-icons/lu';
import { SiAnthropic, SiGoogle, SiOpenai } from 'react-icons/si';

import { getAvailableModels } from '@/api/workshop';
import { DeepSeekIcon } from '@/components/icons/DeepSeekIcon';
import { MistralIcon } from '@/components/icons/MistralIcon';

// Helper function to get provider icon
const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
        case 'google':
            return <SiGoogle className="w-4 h-4" />;
        case 'openai':
            return <SiOpenai className="w-4 h-4" />;
        case 'mistral ai':
            return <MistralIcon className="w-4 h-4" />;
        case 'deepseek':
            return <DeepSeekIcon className="w-4 h-4" />;
        case 'anthropic':
            return <SiAnthropic className="w-4 h-4" />;
        default:
            return <LuBot className="w-4 h-4" />;
    }
};

interface ModelSelectorProps {
    selectedModel?: string;
    onModelChange: (modelId: string) => void;
    className?: string;
}

export const ModelSelector = ({ selectedModel, onModelChange, className }: ModelSelectorProps) => {
    const { data: modelsData, isLoading } = useQuery(getAvailableModels());
    const [localSelectedModel, setLocalSelectedModel] = useState<string>('');

    // Initialize with default model or selected model
    useEffect(() => {
        if (modelsData && !localSelectedModel) {
            const initialModel = selectedModel || modelsData.default_model;

            setLocalSelectedModel(initialModel);

            if (!selectedModel) {
                onModelChange(initialModel);
            }
        }
    }, [modelsData, selectedModel, localSelectedModel, onModelChange]);

    // Update local state when selectedModel prop changes
    useEffect(() => {
        if (selectedModel && selectedModel !== localSelectedModel) {
            setLocalSelectedModel(selectedModel);
        }
    }, [selectedModel, localSelectedModel]);

    const handleModelSelect = (modelId: string) => {
        setLocalSelectedModel(modelId);
        onModelChange(modelId);
    };

    const selectedModelData = modelsData?.models.find((model) => model.id === localSelectedModel);

    if (isLoading || !modelsData) {
        return (
            <div className={classNames('flex items-center gap-2 px-3 py-2 text-sm', className)}>
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-primary/70">Loading models...</span>
            </div>
        );
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className={classNames(
                        'flex items-center justify-between gap-2 px-3 py-2 text-sm',
                        'bg-primary/80 hover:bg-primary/100 data-[state=open]:bg-primary/100 border border-secondary rounded-md',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50',
                        'transition-colors duration-200',
                        className
                    )}
                >
                    <div className="flex items-center gap-2">
                        {selectedModelData ? (
                            getProviderIcon(selectedModelData.provider)
                        ) : (
                            <LuBot className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                            {selectedModelData?.name || 'Select Model'}
                        </span>
                        {selectedModelData && (
                            <span className="text-xs text-primary/60">
                                ({selectedModelData.provider})
                            </span>
                        )}
                    </div>
                    <LuChevronDown className="w-4 h-4 text-primary/60" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className={classNames(
                        'min-w-[280px] bg-primary border border-secondary rounded-md shadow-lg',
                        'p-1 z-50',
                        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
                    )}
                    sideOffset={4}
                >
                    <DropdownMenu.Label className="px-4 pt-2 pb-1 text-xs font-semibold text-primary/70 uppercase tracking-wider">
                        Available Models
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator className="h-px bg-secondary my-1" />

                    {modelsData.models.map((model) => (
                        <DropdownMenu.Item
                            key={model.id}
                            className={classNames(
                                'flex items-center justify-between px-3 gap-4 py-2 text-sm rounded cursor-pointer',
                                'hover:bg-secondary focus:bg-secondary focus:outline-none',
                                'transition-colors duration-150',
                                localSelectedModel === model.id && 'bg-primary/5'
                            )}
                            onSelect={() => handleModelSelect(model.id)}
                        >
                            <div className="flex items-center gap-3">
                                {getProviderIcon(model.provider)}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-primary">
                                            {model.name}
                                        </span>
                                        {model.is_default && (
                                            <span className="px-1.5 py-0.5 text-xs bg-success/20 text-success rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-primary/60">
                                        {model.provider} • {model.id}
                                    </span>
                                </div>
                            </div>
                            {localSelectedModel === model.id && (
                                <LuCheck className="w-4 h-4 text-success" />
                            )}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
