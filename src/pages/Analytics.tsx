import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Eye, 
  Calendar,
  Download,
  Filter,
  ArrowLeft,
  Shirt
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const conversionData = [
    { name: 'Jan', conversion: 65, tryOns: 12000 },
    { name: 'Feb', conversion: 68, tryOns: 13500 },
    { name: 'Mar', conversion: 71, tryOns: 15200 },
    { name: 'Apr', conversion: 69, tryOns: 14800 },
    { name: 'May', conversion: 73, tryOns: 16900 },
    { name: 'Jun', conversion: 76, tryOns: 18200 },
    { name: 'Jul', conversion: 74, tryOns: 17600 },
    { name: 'Aug', conversion: 78, tryOns: 19400 },
    { name: 'Sep', conversion: 81, tryOns: 21000 },
    { name: 'Oct', conversion: 79, tryOns: 20300 },
    { name: 'Nov', conversion: 83, tryOns: 22800 },
    { name: 'Dec', conversion: 85, tryOns: 24500 }
  ];

  const revenueData = [
    { name: 'Jan', revenue: 145000, target: 150000 },
    { name: 'Feb', revenue: 162000, target: 160000 },
    { name: 'Mar', revenue: 178000, target: 170000 },
    { name: 'Apr', revenue: 195000, target: 180000 },
    { name: 'May', revenue: 212000, target: 200000 },
    { name: 'Jun', revenue: 234000, target: 220000 },
    { name: 'Jul', revenue: 251000, target: 240000 },
    { name: 'Aug', revenue: 268000, target: 260000 },
    { name: 'Sep', revenue: 289000, target: 280000 },
    { name: 'Oct', revenue: 312000, target: 300000 },
    { name: 'Nov', revenue: 334000, target: 320000 },
    { name: 'Dec', revenue: 356000, target: 340000 }
  ];

  const categoryData = [
    { name: 'Dresses', value: 35, color: '#8B5CF6' },
    { name: 'Tops', value: 28, color: '#06B6D4' },
    { name: 'Bottoms', value: 20, color: '#10B981' },
    { name: 'Outerwear', value: 12, color: '#F59E0B' },
    { name: 'Accessories', value: 5, color: '#EF4444' }
  ];

  const userEngagementData = [
    { name: 'Week 1', sessions: 2400, avgTime: 4.2 },
    { name: 'Week 2', sessions: 2800, avgTime: 4.8 },
    { name: 'Week 3', sessions: 3200, avgTime: 5.1 },
    { name: 'Week 4', sessions: 3600, avgTime: 5.4 }
  ];

  const kpiCards = [
    {
      title: 'Total Try-Ons',
      value: '2.4M',
      change: '+24%',
      trend: 'up',
      icon: <Eye size={24} />
    },
    {
      title: 'Conversion Rate',
      value: '73.2%',
      change: '+8.5%',
      trend: 'up',
      icon: <TrendingUp size={24} />
    },
    {
      title: 'Active Users',
      value: '45.2K',
      change: '+12%',
      trend: 'up',
      icon: <Users size={24} />
    },
    {
      title: 'Revenue Impact',
      value: '$3.2M',
      change: '+31%',
      trend: 'up',
      icon: <ShoppingBag size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={20} />
                <span>Back to Admin</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Shirt className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Analytics Dashboard</h1>
                  <p className="text-xs text-gray-600">Enterprise Insights</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-400" />
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={16} />
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <p className={`text-sm mt-1 ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.change} from last period
                  </p>
                </div>
                <div className="text-indigo-600">{kpi.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Conversion Rate Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversion" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue vs Target */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Target</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                <Bar dataKey="revenue" fill="#4f46e5" name="Actual Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Try-On by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={userEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Metric</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Current</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Previous</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Change</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Average Session Duration', current: '5.4 min', previous: '4.8 min', change: '+12.5%', trend: 'up' },
                  { metric: 'Bounce Rate', current: '23.1%', previous: '28.4%', change: '-18.7%', trend: 'up' },
                  { metric: 'Items per Session', current: '3.2', previous: '2.8', change: '+14.3%', trend: 'up' },
                  { metric: 'Return Customer Rate', current: '67.8%', previous: '61.2%', change: '+10.8%', trend: 'up' },
                  { metric: 'Mobile Usage', current: '78.3%', previous: '74.1%', change: '+5.7%', trend: 'up' }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium text-gray-900">{row.metric}</td>
                    <td className="py-3 px-6 text-gray-900">{row.current}</td>
                    <td className="py-3 px-6 text-gray-600">{row.previous}</td>
                    <td className={`py-3 px-6 font-medium ${row.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {row.change}
                    </td>
                    <td className="py-3 px-6">
                      <TrendingUp 
                        size={16} 
                        className={row.trend === 'up' ? 'text-emerald-600' : 'text-red-600 rotate-180'} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;