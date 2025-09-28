import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Eye, 
  ShoppingCart, 
  TrendingUp, 
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { analytics } from '../services/analyticsService';

interface RealTimeMetrics {
  activeUsers: number;
  pageViews: number;
  tryOns: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
  userFlow: Array<{ step: string; users: number; dropoff: number }>;
  realtimeEvents: Array<{ timestamp: Date; event: string; user: string }>;
}

export const RealTimeAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchRealTimeMetrics();
    
    // Update every 30 seconds
    const interval = setInterval(fetchRealTimeMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeMetrics = async () => {
    try {
      const data = await analytics.getRealTimeMetrics();
      if (data) {
        setMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load real-time metrics</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Active Users',
      value: metrics.activeUsers.toLocaleString(),
      icon: <Users size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Page Views',
      value: metrics.pageViews.toLocaleString(),
      icon: <Eye size={24} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Try-Ons',
      value: metrics.tryOns.toLocaleString(),
      icon: <Activity size={24} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Conversions',
      value: metrics.conversions.toLocaleString(),
      icon: <Target size={24} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h2>
          <p className="text-gray-600">Live data from the last 30 minutes</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <div className={kpi.color}>{kpi.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Flow */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Flow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.userFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="step" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="users" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.topPages}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="views"
              >
                {metrics.topPages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {metrics.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                  ></div>
                  <span className="text-gray-700">{page.page}</span>
                </div>
                <span className="font-medium text-gray-900">{page.views}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="text-emerald-600" size={20} />
            <h4 className="font-semibold text-gray-900">Conversion Rate</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{metrics.conversionRate.toFixed(1)}%</p>
          <p className="text-gray-600 text-sm mt-1">Last 30 minutes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="text-blue-600" size={20} />
            <h4 className="font-semibold text-gray-900">Avg Session Duration</h4>
          </div>
          <p className="text-3xl font-bold text-blue-600">{Math.round(metrics.avgSessionDuration / 60)}m</p>
          <p className="text-gray-600 text-sm mt-1">{metrics.avgSessionDuration}s total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="text-orange-600" size={20} />
            <h4 className="font-semibold text-gray-900">Bounce Rate</h4>
          </div>
          <p className="text-3xl font-bold text-orange-600">{metrics.bounceRate.toFixed(1)}%</p>
          <p className="text-gray-600 text-sm mt-1">Single page sessions</p>
        </div>
      </div>

      {/* Real-time Events Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Live Events</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metrics.realtimeEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 font-medium">{event.event}</span>
                  <span className="text-gray-600 text-sm">by {event.user}</span>
                </div>
                <span className="text-gray-500 text-sm">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
import { useEffect, useState } from "react";
import {
  getWeeklyTryOns,
  getActiveUsers,
  getDailyTrends,
  getPopularItems,
} from "../services/analyticsService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function AnalyticsDashboard() {
  const [weeklyTryOns, setWeeklyTryOns] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [dailyTrends, setDailyTrends] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);

  useEffect(() => {
    getWeeklyTryOns().then(setWeeklyTryOns);
    getActiveUsers().then(setActiveUsers);
    getDailyTrends().then(setDailyTrends);
    getPopularItems().then(setPopularItems);
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Brand Analytics Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-indigo-50 rounded-lg text-center">
          <p className="text-gray-500">Total Try-Ons (7 days)</p>
          <h3 className="text-2xl font-bold text-indigo-700">{weeklyTryOns}</h3>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-gray-500">Active Users (7 days)</p>
          <h3 className="text-2xl font-bold text-green-700">{activeUsers}</h3>
        </div>
      </div>

      {/* Daily Try-On Trend */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Daily Try-Ons</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrends}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#4f46e5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Popular Items */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Top Tried-On Items</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={popularItems}>
            <XAxis dataKey="id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
