interface MistralIconProps {
    className?: string;
}

export const MistralIcon = ({ className = 'w-4 h-4' }: MistralIconProps) => {
    return (
        <svg
            fill="currentColor"
            fillRule="evenodd"
            height="1em"
            style={{ flex: 'none', lineHeight: 1 }}
            viewBox="0 0 24 24"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <title>Mistral</title>
            <path
                clipRule="evenodd"
                d="M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z"
            />
        </svg>
    );
};
