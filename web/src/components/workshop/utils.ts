// Utility functions for date formatting and text processing

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';

    if (diffDays === 1) return '1 day ago';

    if (diffDays < 30) return `${diffDays} days ago`;

    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return `${Math.floor(diffDays / 365)} years ago`;
};

export const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;

    return text.slice(0, maxLength) + '...';
};

export const getPlainText = (html: string) => {
    const tempDiv = document.createElement('div');

    tempDiv.innerHTML = html;

    return tempDiv.textContent || tempDiv.innerText || '';
};

export const getResultsCountMessage = (toolName: string, topics: number, posts: number) => {
    const totalHits = topics + posts;

    switch (toolName) {
        case 'search_topics':
            return `${topics} topic${topics !== 1 ? 's' : ''} found`;
        case 'search_posts':
            return `${posts} post${posts !== 1 ? 's' : ''} found`;
        case 'search_forum':
        default:
            return `${totalHits} result${totalHits !== 1 ? 's' : ''} found`;
    }
};
