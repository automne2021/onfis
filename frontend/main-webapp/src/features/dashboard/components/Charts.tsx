// Pure CSS/SVG chart components — no external dependencies needed
import { useState } from "react";

// ─── Tooltip Component ──────────────────────────────────────────────────────
interface TooltipProps {
    x: number;
    y: number;
    content: string;
    visible: boolean;
}

function ChartTooltip({ x, y, content, visible }: TooltipProps) {
    if (!visible) return null;
    return (
        <div
            className="absolute pointer-events-none z-50 px-2.5 py-1.5 bg-neutral-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap transition-opacity duration-150"
            style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -100%)',
                marginTop: '-8px',
                opacity: visible ? 1 : 0,
            }}
        >
            {content}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800" />
        </div>
    );
}

// ─── Pie Chart ───────────────────────────────────────────────────────────────
interface PieSlice {
    label: string;
    value: number;
    color: string;
}

interface PieChartProps {
    data: PieSlice[];
    title: string;
}

export function PieChart({ data, title }: PieChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    let cumulative = 0;

    // Build conic-gradient stops
    const stops = data
        .map((slice) => {
            const start = (cumulative / total) * 360;
            cumulative += slice.value;
            const end = (cumulative / total) * 360;
            return `${slice.color} ${start}deg ${end}deg`;
        })
        .join(", ");

    return (
        <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 p-4 flex flex-col gap-3">
            <h3 className="font-bold text-sm leading-5 text-neutral-900">{title}</h3>

            <div className="flex items-center gap-5">
                {/* Pie — larger */}
                <div
                    className="w-[140px] h-[140px] rounded-full flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                    style={{
                        background: `conic-gradient(${stops})`,
                    }}
                >
                    {/* Center hole for donut effect */}
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-[70px] h-[70px] rounded-full bg-white flex items-center justify-center shadow-inner">
                            <span className="font-bold text-lg text-neutral-900">{total}</span>
                        </div>
                    </div>
                </div>

                {/* Legend with hover */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    {data.map((slice) => {
                        const pct = ((slice.value / total) * 100).toFixed(1);
                        const isHovered = hoveredSlice === slice.label;
                        return (
                            <div
                                key={slice.label}
                                className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors ${isHovered ? 'bg-neutral-100' : ''}`}
                                onMouseEnter={() => setHoveredSlice(slice.label)}
                                onMouseLeave={() => setHoveredSlice(null)}
                            >
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-150"
                                    style={{
                                        backgroundColor: slice.color,
                                        transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                                    }}
                                />
                                <span className="text-xs text-neutral-500 truncate flex-1">
                                    {slice.label}
                                </span>
                                <span className="text-xs font-medium text-neutral-700 ml-auto">
                                    {slice.value} ({pct}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────
interface BarItem {
    label: string;
    value: number;
    color: string;
}

interface BarChartProps {
    data: BarItem[];
    title: string;
    maxValue?: number;
    itemsPerPage?: number;
}

export function BarChart({ data, title, maxValue, itemsPerPage = 5 }: BarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value), 1);
    const [hoveredBar, setHoveredBar] = useState<string | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; content: string; visible: boolean }>({ x: 0, y: 0, content: '', visible: false });
    const [currentPage, setCurrentPage] = useState(0);

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    const handleBarHover = (item: BarItem, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const parentRect = (e.currentTarget as HTMLElement).closest('.bar-chart-container')?.getBoundingClientRect();
        if (parentRect) {
            setTooltipInfo({
                x: rect.left - parentRect.left + rect.width / 2,
                y: rect.top - parentRect.top,
                content: `${item.label}: ${item.value} tasks`,
                visible: true,
            });
        }
        setHoveredBar(item.label);
    };

    return (
        <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 p-4 flex flex-col gap-3 bar-chart-container relative">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm leading-5 text-neutral-900">{title}</h3>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="w-6 h-6 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                            ‹
                        </button>
                        <span className="text-xs text-neutral-400 min-w-[40px] text-center">
                            {currentPage + 1}/{totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="w-6 h-6 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            <ChartTooltip {...tooltipInfo} />

            <div className="flex flex-col gap-2.5">
                {paginatedData.map((item) => {
                    const pct = ((item.value / max) * 100).toFixed(0);
                    const isHovered = hoveredBar === item.label;
                    return (
                        <div
                            key={item.label}
                            className="flex items-center gap-2 cursor-pointer"
                            onMouseEnter={(e) => handleBarHover(item, e)}
                            onMouseLeave={() => {
                                setHoveredBar(null);
                                setTooltipInfo(prev => ({ ...prev, visible: false }));
                            }}
                        >
                            <span className="text-xs text-neutral-500 w-[60px] flex-shrink-0 truncate">
                                {item.label}
                            </span>
                            <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                    style={{
                                        width: `${(item.value / max) * 100}%`,
                                        backgroundColor: item.color,
                                        opacity: isHovered ? 1 : 0.85,
                                        transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                                    }}
                                >
                                    {(item.value / max) * 100 > 25 && (
                                        <span className="text-white text-[10px] font-medium">{pct}%</span>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-medium text-neutral-700 w-6 text-right flex-shrink-0">
                                {item.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Line Chart (SVG-based) ──────────────────────────────────────────────────
interface LineDataPoint {
    label: string;
    value: number;
}

interface LineChartProps {
    data: LineDataPoint[];
    title: string;
    color?: string;
}

export function LineChart({ data, title, color = "#0014A8" }: LineChartProps) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const chartW = 400;
    const chartH = 160;
    const padX = 35;
    const padY = 20;
    const plotW = chartW - padX * 2;
    const plotH = chartH - padY * 2;

    const points = data.map((d, i) => ({
        x: padX + (i / Math.max(data.length - 1, 1)) * plotW,
        y: padY + plotH - (d.value / max) * plotH,
    }));

    const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

    // Area fill path
    const areaPath = [
        `M ${points[0].x},${chartH - padY}`,
        `L ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`,
        `L ${points[points.length - 1].x},${chartH - padY}`,
        "Z",
    ].join(" ");

    return (
        <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 p-4 flex flex-col gap-2 relative">
            <h3 className="font-bold text-sm leading-5 text-neutral-900">{title}</h3>

            <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <g key={ratio}>
                        <line
                            x1={padX}
                            y1={padY + plotH * (1 - ratio)}
                            x2={chartW - padX}
                            y2={padY + plotH * (1 - ratio)}
                            stroke="#E2E8F0"
                            strokeWidth="0.5"
                        />
                        {/* Y-axis labels */}
                        <text
                            x={padX - 5}
                            y={padY + plotH * (1 - ratio) + 3}
                            textAnchor="end"
                            fontSize="8"
                            fill="#90A1B9"
                        >
                            {Math.round(max * ratio)}
                        </text>
                    </g>
                ))}

                {/* Area fill */}
                <path d={areaPath} fill={color} opacity="0.1" />

                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points — interactive */}
                {points.map((p, i) => (
                    <g
                        key={i}
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                    >
                        {/* Invisible larger hit area */}
                        <circle cx={p.x} cy={p.y} r="12" fill="transparent" />

                        {/* Outer ring on hover */}
                        {hoveredPoint === i && (
                            <circle cx={p.x} cy={p.y} r="8" fill={color} opacity="0.15" />
                        )}

                        {/* Visible dot */}
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint === i ? 5 : 3.5}
                            fill="white"
                            stroke={color}
                            strokeWidth="2"
                            style={{ transition: 'r 0.15s ease' }}
                        />

                        {/* Tooltip on hover */}
                        {hoveredPoint === i && (
                            <g>
                                <rect
                                    x={p.x - 30}
                                    y={p.y - 32}
                                    width="60"
                                    height="22"
                                    rx="4"
                                    fill="#1e293b"
                                />
                                <text
                                    x={p.x}
                                    y={p.y - 18}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fontWeight="600"
                                    fill="white"
                                >
                                    {data[i].label}: {data[i].value}
                                </text>
                                {/* Tooltip arrow */}
                                <polygon
                                    points={`${p.x - 4},${p.y - 10} ${p.x + 4},${p.y - 10} ${p.x},${p.y - 6}`}
                                    fill="#1e293b"
                                />
                            </g>
                        )}
                    </g>
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text
                        key={i}
                        x={points[i].x}
                        y={chartH - 3}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#90A1B9"
                    >
                        {d.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
