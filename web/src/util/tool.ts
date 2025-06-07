// Tool status types and utilities

export type ToolStatus = 'starting' | 'executing' | 'success' | 'error' | string;

export interface StatusStyles {
    container: string;
    header: string;
    badge: string;
    text: string;
}

// Get status icon name for use with icon components
export const getStatusIconName = (status: ToolStatus): string => {
    switch (status.toLowerCase()) {
        case 'starting':
            return 'cog-spin';
        case 'executing':
            return 'loader-spin';
        case 'success':
            return 'check';
        case 'error':
            return 'x';
        default:
            return 'cog';
    }
};

// Get status-specific CSS classes
export const getStatusStyles = (status: ToolStatus): StatusStyles => {
    switch (status.toLowerCase()) {
        case 'starting':
            return {
                container: 'border-secondary bg-secondary/30',
                header: 'bg-secondary/50 border-secondary',
                badge: 'bg-secondary text-primary',
                text: 'text-secondary',
            };
        case 'executing':
            return {
                container: 'border-warning/30 bg-warning/10',
                header: 'bg-warning/20 border-warning/30',
                badge: 'bg-warning text-white',
                text: 'text-warning',
            };
        case 'success':
            return {
                container: 'border-success/30 bg-success/10',
                header: 'bg-success/20 border-success/30',
                badge: 'bg-success text-white',
                text: 'text-success',
            };
        case 'error':
            return {
                container: 'border-error/30 bg-error/10',
                header: 'bg-error/20 border-error/30',
                badge: 'bg-error text-white',
                text: 'text-error',
            };
        default:
            return {
                container: 'border-primary/20 bg-primary',
                header: 'bg-secondary/50 border-primary/20',
                badge: 'bg-primary/20 text-primary',
                text: 'text-primary',
            };
    }
};

// Get human-readable status text
export const getStatusText = (status: ToolStatus): string => {
    switch (status.toLowerCase()) {
        case 'starting':
            return 'Initializing';
        case 'executing':
            return 'In Progress';
        case 'success':
            return 'Completed';
        case 'error':
            return 'Failed';
        default:
            return `Unknown (${status})`;
    }
};

// Check if a tool supports rich rendering
export const getRichRendering = (toolName: string): boolean => {
    return [
        'get_posts',
        'get_topic_summary',
        'search_forum',
        'search_topics',
        'search_posts',
        'search_posts_in_topic',
        'search_by_user',
        'get_user_profile',
        'get_user_summary',
        'username_to_user_id',
        'search_by_username',
        'search_by_username_mention',
    ].includes(toolName);
};

// Check if a tool is a search tool
export const isSearchTool = (toolName: string): boolean => {
    return [
        'search_forum',
        'search_topics',
        'search_posts',
        'search_posts_in_topic',
        'search_by_user',
        'search_by_username',
        'search_by_username_mention',
    ].includes(toolName);
};
