"use client";
import React from "react";
import type { RevenueAnalyticsPoint } from "@/features/admin/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data?: RevenueAnalyticsPoint[];
  loading?: boolean;
}

const RevenueChart = ({ data = [], loading = false }: RevenueChartProps) => {
  // Format day labels nicely (e.g. "Oct 04" or weekday)
  const chartData = data.map((item) => {
    let label = item.day;
    try {
      const parsed = new Date(item.day);
      if (!isNaN(parsed.getTime())) {
        label = parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch {
      // keep fallback
    }
    return {
      name: label,
      revenue: item.revenue,
      bookings: item.bookings,
    };
  });

  return (
    <div className="w-full h-full bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Revenue Insights</h2>
        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
          PostgreSQL Aggregated (Last 7 Days)
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No confirmed bookings recorded in this timeframe.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260} className="pb-2">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip
              formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, "Revenue"]}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, fill: "#6366f1" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueChart;
