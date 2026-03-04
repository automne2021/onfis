import type { CSSProperties } from "react";

interface IconProps {
    /** Material Symbols icon name, e.g. "search", "close", "add" */
    name: string;
    /** Icon size in pixels (applied as font-size) */
    size?: number;
    /** Icon color (CSS color value) */
    color?: string;
    /** If true, uses the filled variant */
    filled?: boolean;
    /** Additional CSS class names */
    className?: string;
    /** Additional inline styles */
    style?: CSSProperties;
}

/**
 * Wrapper for Google Material Symbols Outlined.
 * Usage: <Icon name="search" size={14} color="#90A1B9" />
 */
export default function Icon({
    name,
    size = 24,
    color,
    filled = false,
    className = "",
    style,
}: IconProps) {
    return (
        <span
            className={`material-symbols-outlined ${className}`}
            style={{
                fontSize: size,
                color,
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
                lineHeight: `${size}px`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                verticalAlign: "middle",
                width: size,
                height: size,
                overflow: "hidden",
                userSelect: "none",
                ...style,
            }}
        >
            {name}
        </span>
    );
}
