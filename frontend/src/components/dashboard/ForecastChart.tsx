"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export function ForecastChart({
    data,
}: {
    data: { periodKey: string; quantity: number }[];
}) {
    return (
        <div className="h-full min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />

                    <XAxis
                        dataKey="periodKey"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        stroke="#64748b"
                        fontWeight={600}
                    />

                    <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="#64748b"
                        fontWeight={600}
                    />

                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                            padding: '12px 16px',
                            fontWeight: 'bold',
                            color: '#1e293b'
                        }}
                        itemStyle={{ color: '#3b82f6' }}
                    />

                    <Line
                        type="monotone"
                        dataKey="quantity"
                        name="Prediksi"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        dot={{ r: 4, fill: "#ffffff", strokeWidth: 2.5, stroke: "#3b82f6" }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: "#1d4ed8" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}