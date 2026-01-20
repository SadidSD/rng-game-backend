"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

const defaultData = [
    { name: "Mon", total: 4200 },
    { name: "Tue", total: 3800 },
    { name: "Wed", total: 5100 },
    { name: "Thu", total: 4600 },
    { name: "Fri", total: 6200 },
    { name: "Sat", total: 7800 },
    { name: "Sun", total: 5400 },
]

export function SalesChart({ data }: { data?: any[] }) {
    const chartData = data && data.length > 0 ? data : defaultData;
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Sales
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                                ${payload[0].value}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="total"
                    strokeWidth={2}
                    activeDot={{
                        r: 6,
                        style: { fill: "var(--theme-primary)", opacity: 0.25 },
                    }}
                    style={
                        {
                            stroke: "var(--theme-primary)",
                            "--theme-primary": "hsl(var(--primary))",
                        } as React.CSSProperties
                    }
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
