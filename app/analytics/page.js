'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import ComingSoon from '../components/ComingSoon';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { 
  FaRupeeSign, 
  FaShoppingCart, 
  FaUsers, 
  FaCheckCircle, 
  FaArrowUp, 
  FaArrowDown,
  FaCalendarAlt,
  FaFilter,
  FaTable,
  FaCreditCard,
  FaUtensils,
  FaClock,
  FaChartLine
} from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');
  
  // Environment detection
  const [isProduction, setIsProduction] = useState(false);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    tables: [],
    statuses: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    paymentMethods: ['cash', 'card', 'upi', 'wallet']
  });

  // Check environment on component mount
  useEffect(() => {
    const checkEnvironment = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isProductionDomain = hostname.includes('tap2orders.com');
        setIsProduction(isProductionDomain);
      }
    };
    
    checkEnvironment();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [session?.user?.id, period, dateRange, selectedCategory, selectedTable, selectedStatus, selectedPaymentMethod]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/filter-options');
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
      }
    } catch (error) {
      // Error fetching filter options, continue with defaults
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: period.toString(),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedTable !== 'all' && { table: selectedTable }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPaymentMethod !== 'all' && { paymentMethod: selectedPaymentMethod })
      });

      const response = await fetch(`/api/hotel-analytics?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      setError('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedCategory('all');
    setSelectedTable('all');
    setSelectedStatus('all');
    setSelectedPaymentMethod('all');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Enhanced chart options with animations and better styling
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#f59e0b',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutBounce'
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        cornerRadius: 8
      }
    },
    animation: {
      animateRotate: true,
      duration: 2000
    },
    cutout: '60%'
  };

  // Show coming soon for production environment
  if (isProduction) {
    return <ComingSoon feature="Analytics Dashboard" />;
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4 sm:mb-6"></div>
            <div className="absolute inset-0 rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-transparent border-r-pink-400 animate-ping mx-auto"></div>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Loading Analytics...</p>
          <p className="text-sm text-gray-500">Preparing your business insights</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4 sm:mb-6 text-base sm:text-lg font-semibold">Error: {error}</p>
          <button 
            onClick={fetchAnalytics}
            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Header />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto mt-20">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                📊 Business Analytics
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Transform your data into actionable insights</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-white/30 shadow-lg">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setPeriod('7')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      period === '7'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    📅 7 Days
                  </button>
                  <button
                    onClick={() => setPeriod('30')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      period === '30'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    📅 30 Days
                  </button>
                  <button
                    onClick={() => setPeriod('90')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      period === '90'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    📅 90 Days
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base font-medium"
              >
                <FaFilter className="w-4 h-4" />
                <span>Advanced Filters</span>
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <FaCalendarAlt className="mr-2 text-purple-500" />
                    Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input 
                      type="date" 
                      value={dateRange.startDate} 
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="flex-1 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                    />
                    <input 
                      type="date" 
                      value={dateRange.endDate} 
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="flex-1 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <FaUtensils className="mr-2 text-orange-500" />
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none bg-gradient-to-r from-white to-gray-50 border-2 border-orange-200 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all text-sm font-medium text-gray-700 hover:border-orange-300 cursor-pointer shadow-sm"
                    >
                      <option value="all" className="bg-white text-gray-700">🍽️ All Categories</option>
                      {filterOptions.categories.map(category => (
                        <option key={category} value={category} className="bg-white text-gray-700">{category}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <FaTable className="mr-2 text-blue-500" />
                    Table
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full appearance-none bg-gradient-to-r from-white to-gray-50 border-2 border-blue-200 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all text-sm font-medium text-gray-700 hover:border-blue-300 cursor-pointer shadow-sm"
                    >
                      <option value="all" className="bg-white text-gray-700">🪑 All Tables</option>
                      {filterOptions.tables.map(table => (
                        <option key={table} value={table} className="bg-white text-gray-700">Table {table}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <FaClock className="mr-2 text-green-500" />
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full appearance-none bg-gradient-to-r from-white to-gray-50 border-2 border-green-200 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all text-sm font-medium text-gray-700 hover:border-green-300 cursor-pointer shadow-sm"
                    >
                      <option value="all" className="bg-white text-gray-700">⏱️ All Status</option>
                      {filterOptions.statuses.map(status => (
                        <option key={status} value={status} className="bg-white text-gray-700">{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <FaCreditCard className="mr-2 text-pink-500" />
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full appearance-none bg-gradient-to-r from-white to-gray-50 border-2 border-pink-200 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm font-medium text-gray-700 hover:border-pink-300 cursor-pointer shadow-sm"
                    >
                      <option value="all" className="bg-white text-gray-700">💳 All Methods</option>
                      {filterOptions.paymentMethods.map(method => (
                        <option key={method} value={method} className="bg-white text-gray-700">{method.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex items-end sm:col-span-1">
                  <button 
                    onClick={resetFilters}
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2.5 rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 text-sm font-medium shadow-sm"
                  >
                    🔄 Reset All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="text-red-400 mr-3 text-lg sm:text-xl">⚠️</div>
              <p className="font-semibold text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.kpis.totalOrders)}</p>
                <div className="flex items-center mt-2">
                  {analytics.growth.dailyGrowth >= 0 ? (
                    <FaArrowUp className="w-4 h-4 text-green-300 mr-1" />
                  ) : (
                    <FaArrowDown className="w-4 h-4 text-red-300 mr-1" />
                  )}
                  <span className={`text-sm font-semibold ${analytics.growth.dailyGrowth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {analytics.growth.dailyGrowth}%
                  </span>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FaShoppingCart className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(analytics.kpis.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  {analytics.growth.revenueGrowth >= 0 ? (
                    <FaArrowUp className="w-4 h-4 text-green-300 mr-1" />
                  ) : (
                    <FaArrowDown className="w-4 h-4 text-red-300 mr-1" />
                  )}
                  <span className={`text-sm font-semibold ${analytics.growth.revenueGrowth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {analytics.growth.revenueGrowth}%
                  </span>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FaRupeeSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
                <p className="text-3xl font-bold">{formatCurrency(analytics.kpis.averageOrderValue)}</p>
                <p className="text-purple-200 text-sm mt-2">Per order</p>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FaUtensils className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm sm:text-base font-medium">Completion Rate</p>
                <p className="text-2xl sm:text-3xl font-bold">{analytics.kpis.completionRate}%</p>
                <p className="text-orange-200 text-sm mt-2">Success rate</p>
              </div>
              <div className="text-2xl">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaChartLine className="mr-3 text-blue-500" />
              Revenue & Orders Trend
            </h3>
            <div className="h-80 sm:h-96 md:h-120 lg:h-140 xl:h-160">
              <Line
                data={{
                  labels: analytics.revenueTrend.labels,
                  datasets: analytics.revenueTrend.datasets.map((dataset, index) => ({
                    ...dataset,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4
                  }))
                }}
                options={lineOptions}
              />
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaClock className="mr-3 text-orange-500" />
              Monthly Revenue
            </h3>
            <div className="h-80 sm:h-96 md:h-120 lg:h-140 xl:h-160">
              <Bar
                data={{
                  labels: analytics.monthlyRevenue.labels,
                  datasets: [{
                    data: analytics.monthlyRevenue.data,
                    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 8,
                    borderSkipped: false,
                  }]
                }}
                options={barOptions}
              />
            </div>
          </div>
        </div>

        {/* Pie Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Order Status Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaClock className="mr-3 text-green-500" />
              Order Status Distribution
            </h3>
            <div className="h-80 sm:h-96 md:h-120 lg:h-140 xl:h-160">
              {analytics.orderStatus.data.length > 0 && analytics.orderStatus.data[0] !== 1 ? (
                <Doughnut
                  data={{
                    labels: analytics.orderStatus.labels,
                    datasets: [{
                      data: analytics.orderStatus.data,
                      backgroundColor: [
                        '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#059669', '#ef4444'
                      ],
                      borderWidth: 3,
                      borderColor: '#ffffff',
                      hoverBorderWidth: 5
                    }]
                  }}
                  options={doughnutOptions}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <p className="text-gray-500 text-lg font-semibold">No order data available</p>
                    <p className="text-sm text-gray-400">Start taking orders to see analytics</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaCreditCard className="mr-3 text-pink-500" />
              Payment Methods
            </h3>
            <div className="h-80 sm:h-96 md:h-120 lg:h-140 xl:h-160">
              {analytics.paymentMethods.data.length > 0 && analytics.paymentMethods.data[0] !== 1 ? (
                <Pie
                  data={{
                    labels: analytics.paymentMethods.labels,
                    datasets: [{
                      data: analytics.paymentMethods.data,
                      backgroundColor: [
                        '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
                      ],
                      borderWidth: 3,
                      borderColor: '#ffffff',
                      hoverBorderWidth: 5
                    }]
                  }}
                  options={doughnutOptions}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">💳</div>
                    <p className="text-gray-500 text-lg font-semibold">No payment data</p>
                    <p className="text-sm text-gray-400">Payment methods will show here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Menu Items */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FaUsers className="mr-3 text-yellow-500" />
            Top Performing Menu Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topMenuItems.slice(0, 6).map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(item.revenue)}</p>
                  </div>
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FaClock className="mr-3 text-indigo-500" />
            Peak Hours Analysis
          </h3>
          <div className="h-80 sm:h-96 md:h-120 lg:h-140 xl:h-160">
            <Bar
              data={{
                labels: analytics.peakHours.labels,
                datasets: [{
                  data: analytics.peakHours.data,
                  backgroundColor: analytics.peakHours.data.map(value => 
                    value > Math.max(...analytics.peakHours.data) * 0.7 ? '#ef4444' :
                    value > Math.max(...analytics.peakHours.data) * 0.4 ? '#f59e0b' : '#10b981'
                  ),
                  borderRadius: 4,
                  borderSkipped: false,
                }]
              }}
              options={barOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
