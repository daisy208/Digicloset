import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Shirt,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Brand {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'inactive' | 'trial';
  users: number;
  tryOns: number;
  conversion: number;
  revenue: number;
  joinDate: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  brand: string;
  role: 'admin' | 'user' | 'viewer';
  lastActive: string;
  tryOns: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'users' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const mockBrands: Brand[] = [
    {
      id: '1',
      name: 'Fashion Forward',
      logo: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=100',
      status: 'active',
      users: 45,
      tryOns: 12450,
      conversion: 73.2,
      revenue: 245000,
      joinDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'StyleHub',
      logo: 'https://images.pexels.com/photos/1103834/pexels-photo-1103834.jpeg?auto=compress&cs=tinysrgb&w=100',
      status: 'active',
      users: 32,
      tryOns: 8920,
      conversion: 68.5,
      revenue: 189000,
      joinDate: '2024-02-20'
    },
    {
      id: '3',
      name: 'Urban Threads',
      logo: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
      status: 'trial',
      users: 12,
      tryOns: 2340,
      conversion: 71.8,
      revenue: 45000,
      joinDate: '2024-11-01'
    }
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@fashionforward.com',
      brand: 'Fashion Forward',
      role: 'admin',
      lastActive: '2 hours ago',
      tryOns: 156
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      email: 'marcus@stylehub.com',
      brand: 'StyleHub',
      role: 'admin',
      lastActive: '1 day ago',
      tryOns: 89
    },
    {
      id: '3',
      name: 'Emma Thompson',
      email: 'emma@urbanthreads.com',
      brand: 'Urban Threads',
      role: 'user',
      lastActive: '3 hours ago',
      tryOns: 234
    }
  ];

  const overviewStats = [
    { title: 'Total Brands', value: '156', change: '+12%', icon: <ShoppingBag size={24} /> },
    { title: 'Active Users', value: '2,847', change: '+18%', icon: <Users size={24} /> },
    { title: 'Monthly Try-Ons', value: '847K', change: '+24%', icon: <Eye size={24} /> },
    { title: 'Platform Revenue', value: '$1.2M', change: '+31%', icon: <TrendingUp size={24} /> }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800',
      inactive: 'bg-red-100 text-red-800',
      trial: 'bg-yellow-100 text-yellow-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`;
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles]}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={20} />
                <span>Back to Landing</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Shirt className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">VirtualFit Admin</h1>
                  <p className="text-xs text-gray-600">Enterprise Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
              { id: 'brands', label: 'Brands', icon: <ShoppingBag size={16} /> },
              { id: 'users', label: 'Users', icon: <Users size={16} /> },
              { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-emerald-600 text-sm mt-1">{stat.change} from last month</p>
                    </div>
                    <div className="text-indigo-600">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { action: 'New brand registered', brand: 'Trendy Fashion Co.', time: '2 hours ago' },
                    { action: 'High conversion rate alert', brand: 'Fashion Forward', time: '4 hours ago' },
                    { action: 'Monthly report generated', brand: 'StyleHub', time: '1 day ago' },
                    { action: 'API integration completed', brand: 'Urban Threads', time: '2 days ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-gray-600 text-sm">{activity.brand}</p>
                      </div>
                      <span className="text-gray-500 text-sm">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Brand Management</h2>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter size={16} />
                  <span>Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download size={16} />
                  <span>Export</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus size={16} />
                  <span>Add Brand</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Brand</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Users</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Try-Ons</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Conversion</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Revenue</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBrands.map(brand => (
                      <tr key={brand.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium text-gray-900">{brand.name}</p>
                              <p className="text-gray-600 text-sm">Joined {brand.joinDate}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={getStatusBadge(brand.status)}>
                            {brand.status.charAt(0).toUpperCase() + brand.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-900">{brand.users}</td>
                        <td className="py-4 px-6 text-gray-900">{brand.tryOns.toLocaleString()}</td>
                        <td className="py-4 px-6 text-gray-900">{brand.conversion}%</td>
                        <td className="py-4 px-6 text-gray-900">${brand.revenue.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-600 hover:text-indigo-600">
                              <Eye size={16} />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-indigo-600">
                              <Edit size={16} />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter size={16} />
                  <span>Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus size={16} />
                  <span>Invite User</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">User</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Brand</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Role</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Try-Ons</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Last Active</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-gray-600 text-sm">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">{user.brand}</td>
                        <td className="py-4 px-6">
                          <span className={getRoleBadge(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-900">{user.tryOns}</td>
                        <td className="py-4 px-6 text-gray-600">{user.lastActive}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-600 hover:text-indigo-600">
                              <Edit size={16} />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
              <Link 
                to="/analytics" 
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <BarChart3 size={16} />
                <span>View Full Analytics</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Growth</h3>
                <div className="h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">+127%</div>
                    <div className="text-gray-600">Growth this quarter</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subscription Revenue</span>
                    <span className="font-semibold text-gray-900">$890K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Enterprise Deals</span>
                    <span className="font-semibold text-gray-900">$340K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">API Usage</span>
                    <span className="font-semibold text-gray-900">$120K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;