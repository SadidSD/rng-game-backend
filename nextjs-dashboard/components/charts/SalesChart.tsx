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

const data = [
    { date: "Mon", sales: 4200 },
    { date: "Tue", sales: 3800 },
    { date: "Wed", sales: 5100 },
    { date: "Thu", sales: 4600 },
    { date: "Fri", sales: 6200 },
    { date: "Sat", sales: 7800 },
    { date: "Sun", sales: 5400 },
]

export function SalesChart() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="date"
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
                    dataKey="sales"
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
