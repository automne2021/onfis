// Pure CSS/SVG chart components — no external dependencies needed

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

            <div className="flex items-center gap-4">
                {/* Pie */}
                <div
                    className="w-[100px] h-[100px] rounded-full flex-shrink-0"
                    style={{
                        background: `conic-gradient(${stops})`,
                    }}
                >
                    {/* Center hole for donut effect */}
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center">
                            <span className="font-bold text-sm text-neutral-900">{total}</span>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-1.5 min-w-0">
                    {data.map((slice) => (
                        <div key={slice.label} className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: slice.color }}
                            />
                            <span className="text-xs text-neutral-500 truncate">
                                {slice.label}
                            </span>
                            <span className="text-xs font-medium text-neutral-700 ml-auto">
                                {slice.value}
                            </span>
                        </div>
                    ))}
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
}

export function BarChart({ data, title, maxValue }: BarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 p-4 flex flex-col gap-3">
            <h3 className="font-bold text-sm leading-5 text-neutral-900">{title}</h3>

            <div className="flex flex-col gap-2">
                {data.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-[60px] flex-shrink-0 truncate">
                            {item.label}
                        </span>
                        <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${(item.value / max) * 100}%`,
                                    backgroundColor: item.color,
                                }}
                            />
                        </div>
                        <span className="text-xs font-medium text-neutral-700 w-6 text-right flex-shrink-0">
                            {item.value}
                        </span>
                    </div>
                ))}
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
    const chartW = 280;
    const chartH = 100;
    const padX = 30;
    const padY = 10;
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
        <div className="bg-white rounded-[12px] shadow-sm border border-neutral-100 p-4 flex flex-col gap-2">
            <h3 className="font-bold text-sm leading-5 text-neutral-900">{title}</h3>

            <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                        key={ratio}
                        x1={padX}
                        y1={padY + plotH * (1 - ratio)}
                        x2={chartW - padX}
                        y2={padY + plotH * (1 - ratio)}
                        stroke="#E2E8F0"
                        strokeWidth="0.5"
                    />
                ))}

                {/* Area fill */}
                <path d={areaPath} fill={color} opacity="0.08" />

                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text
                        key={i}
                        x={points[i].x}
                        y={chartH - 1}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#90A1B9"
                    >
                        {d.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
