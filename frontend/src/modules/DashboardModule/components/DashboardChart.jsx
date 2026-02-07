import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, Spin } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function DashboardChart({
    data = [],
    isLoading = false,
    title = 'Income vs Expense',
    height = 350,
}) {
    const translate = useLanguage();

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        backgroundColor: '#fff',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                    }}
                >
                    <p className="label" style={{ marginBottom: 5, fontWeight: 'bold' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, margin: 0 }}>
                            {translate(entry.name)}: {entry.value?.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card
            title={translate(title)}
            bordered={false}
            className="whiteBox shadow"
            style={{
                height: '100%',
                borderRadius: '10px',
                marginBottom: '20px',
            }}
            styles={{ body: { padding: '0 20px 20px 0' } }}
        >
            {isLoading ? (
                <div
                    style={{
                        height: height,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Spin />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            stroke="#8c8c8c"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            minTickGap={20}
                        />
                        <YAxis
                            stroke="#8c8c8c"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value;
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#1890ff"
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            strokeWidth={3}
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            name="Expense"
                            stroke="#ff4d4f"
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}
