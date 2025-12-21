interface LogoProps {
    className?: string
    width?: number
    height?: number
    style?: React.CSSProperties
}

export function Logo({ className = "", width = 320, height = 64, style }: LogoProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 320 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
        >
            <text
                x="0"
                y="48"
                fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                fontSize="48"
                fontWeight="400"
                fill="currentColor"
                letterSpacing="-0.02em"
            >
                <tspan fontWeight="600">1</tspan>
                <tspan>picday</tspan>
            </text>
        </svg>
    )
}
