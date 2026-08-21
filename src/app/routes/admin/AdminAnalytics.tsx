import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Star, Clock } from 'lucide-react';
import { mockStore } from '@/lib/supabase/mock-store';

// Static chart data — never changes at runtime.
const DAILY_DELIVERIES_DATA = [
  { day: 'Mon', completed: 32, target: 30 },
  { day: 'Tue', completed: 45, target: 35 },
  { day: 'Wed', completed: 58, target: 40 },
  { day: 'Thu', completed: 52, target: 40 },
  { day: 'Fri', completed: 68, target: 50 },
  { day: 'Sat', completed: 74, target: 60 },
  { day: 'Sun', completed: 41, target: 35 },
];

const AVG_DURATION_DATA = [
  { hour: '08:00', minutes: 24 },
  { hour: '10:00', minutes: 31 },
  { hour: '12:00', minutes: 38 },
  { hour: '14:00', minutes: 29 },
  { hour: '16:00', minutes: 42 },
  { hour: '18:00', minutes: 35 },
];

const RATINGS_DISTRIBUTION = [
  { stars: '5 Stars', count: 185, color: '#1E9E64' },
  { stars: '4 Stars', count: 42, color: '#F5A623' },
  { stars: '3 Stars', count: 12, color: '#60A5FA' },
  { stars: '2 Stars', count: 3, color: '#F7941D' },
  { stars: '1 Star', count: 1, color: '#D64545' },
];

// FIX INEFFICIENCY 4: derive live KPI metrics from actual mock store data.
function useAnalyticsMetrics() {
  const [metrics, setMetrics] = useState(() => computeMetrics());

  useEffect(() => {
    const unsubscribe = mockStore.subscribe(() => setMetrics(computeMetrics()));
    return () => unsubscribe();
  }, []);

  return metrics;
}

function computeMetrics() {
  const deliveries = mockStore.getDeliveries();
  const riders = mockStore.getRiders();
  const ratings = mockStore.getRatings();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weeklyDeliveries = deliveries.filter(
    (d) => d.status === 'delivered' && d.delivered_at && new Date(d.delivered_at) >= weekStart
  );

  const avgStars =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
      : 0;

  // On-time: delivered before estimated_delivery_at
  const onTimeCount = weeklyDeliveries.filter(
    (d) => d.delivered_at && d.estimated_delivery_at && new Date(d.delivered_at) <= new Date(d.estimated_delivery_at)
  ).length;
  const onTimePct = weeklyDeliveries.length > 0
    ? Math.round((onTimeCount / weeklyDeliveries.length) * 1000) / 10
    : 100;

  // Avg delivery duration in minutes (accepted → delivered)
  const durationsMin = weeklyDeliveries
    .filter((d) => d.accepted_at && d.delivered_at)
    .map((d) => (new Date(d.delivered_at!).getTime() - new Date(d.accepted_at!).getTime()) / 60000);
  const avgDuration =
    durationsMin.length > 0
      ? Math.round((durationsMin.reduce((s, v) => s + v, 0) / durationsMin.length) * 10) / 10
      : 0;

  return {
    weeklyCount: weeklyDeliveries.length,
    avgDuration,
    avgStars,
    onTimePct,
    totalRiders: riders.length,
  };
}

export const AdminAnalytics: React.FC = () => {
  // FIX INEFFICIENCY 4: real live stats instead of hardcoded strings.
  const metrics = useAnalyticsMetrics();

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Operational Analytics & KPI Reports</h2>
        <p className="text-xs text-muted">Fleet throughput, delivery duration latency, and customer satisfaction metrics</p>
      </div>

      {/* Top Metric Cards — live data from mockStore */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card bg-white">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Weekly Deliveries</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics.weeklyCount}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Last 7 days</span>
        </Card>

        <Card className="p-4 shadow-card bg-white">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Avg Delivery Duration</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">
            {metrics.avgDuration > 0 ? `${metrics.avgDuration} min` : '--'}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Accepted → Delivered</span>
        </Card>

        <Card className="p-4 shadow-card bg-white">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Fleet Satisfaction</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">
            {metrics.avgStars > 0 ? `${metrics.avgStars} / 5.0` : '--'}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Customer ratings</span>
        </Card>

        <Card className="p-4 shadow-card bg-white">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>On-Time SLA</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics.onTimePct}%</div>
          <span className="text-[11px] text-emerald-600 font-semibold">SLA Target 95%</span>
        </Card>
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Volume vs Target */}
        <Card className="shadow-card p-5 space-y-4">
          <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Daily Volume vs Target
          </CardTitle>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_DELIVERIES_DATA}>
                <XAxis dataKey="day" stroke="#6B6B7A" fontSize={11} />
                <YAxis stroke="#6B6B7A" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="completed" fill="#1D4ED8" name="Completed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" fill="#F5A623" name="SLA Target" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Average Duration Trend */}
        <Card className="shadow-card p-5 space-y-4">
          <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Average Delivery Latency by Time of Day (mins)
          </CardTitle>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={AVG_DURATION_DATA}>
                <XAxis dataKey="hour" stroke="#6B6B7A" fontSize={11} />
                <YAxis stroke="#6B6B7A" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#F5A623"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#1D4ED8' }}
                  name="Avg Minutes"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Rating Distribution Pie */}
        <Card className="shadow-card p-5 space-y-4 lg:col-span-2">
          <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Customer Feedback & Rating Breakdown
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={RATINGS_DISTRIBUTION}
                    dataKey="count"
                    nameKey="stars"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {RATINGS_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pr-4">
              {RATINGS_DISTRIBUTION.map((item) => (
                <div key={item.stars} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.stars}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.count} ratings</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
