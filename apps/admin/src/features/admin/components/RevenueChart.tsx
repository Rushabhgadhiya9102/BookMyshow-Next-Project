"use client";
import type { Ticket } from "@/features/tickets/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  tickets: Ticket[];
}

const RevenueChart = ({ tickets }: RevenueChartProps) => {
  // ============================
  // TODAY REVENUE
  // ============================
  const today = new Date().toISOString().split("T")[0];

  const todayRevenue = tickets
    .filter(t => t.createdAt.split("T")[0] === today)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // ============================
  // THIS WEEK REVENUE (Mon-Sun)
  // ============================

  const weekRevenue: Record<string, number> = {};

  tickets.forEach(t => {
    const date = new Date(t.createdAt);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const todayDate = new Date();
    const diffDays =
      (todayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) {
      weekRevenue[dayName] = (weekRevenue[dayName] || 0) + Number(t.amount);
    }
  });

  // ============================
  // LAST MONTH REVENUE
  // ============================
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthYear = lastMonth === 11 ? now.getFullYear() - 1 : now.getFullYear();

  const lastMonthRevenue = tickets
    .filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    })
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // ============================
  // COMBINED CHART DATA
  // ============================

  const chartData = [
    { name: "Today", revenue: todayRevenue },
    ...Object.keys(weekRevenue).map((day) => ({
      name: day,
      revenue: weekRevenue[day],
    })),
    { name: "Last Month", revenue: lastMonthRevenue },
  ];

  return (
    <div className="w-full h-full bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      <h2 className="text-lg font-bold mb-3">Revenue Insights</h2>
      <ResponsiveContainer width="100%" height="100%" className='pb-7'>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
