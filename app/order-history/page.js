"use client";
import { useState, useEffect } from "react";
import { format, getYear, getMonth, getDate, set } from "date-fns";
import RefreshButton from "../components/RefreshButton";
import DownloadButton from "../components/DownloadButton";
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineCalendar, HiOutlineCurrencyRupee, HiOutlineChartBar } from "react-icons/hi";
import { FaChartLine, FaCalendarAlt, FaRupeeSign, FaClipboardList } from "react-icons/fa";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Simple currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format time to 12-hour format with AM/PM
const formatTime12Hour = (dateTimeString) => {
  const date = new Date(dateTimeString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${formattedMinutes} ${ampm}`;
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300'
    },
    completed: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200'
    },
    cancelled: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-md border ${config.bg} ${config.text} ${config.border}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function OrderHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orderHistory, setOrderHistory] = useState([]);
  const [itemSales, setItemSales] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [yearlyRevenue, setYearlyRevenue] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Get current year, month, and date
  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date());
  const currentDate = getDate(new Date());

  // Generate years from 2001 to current year
  const years = Array.from({ length: currentYear - 2001 + 1 }, (_, i) => 2001 + i);

  // Generate months (0-11)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate days based on selected month and year
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Handle date change
  const handleDateChange = async (year, month, day) => {
    setLoading(true);
    setError(null);
    
    // Create date string in YYYY-MM-DD format
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(new Date(dateStr));
    
    try {
      // Get authentication token
      let authHeaders = {};
      const token = localStorage.getItem('authToken');
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/order-history?date=${dateStr}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          return;
        }
        throw new Error('Failed to fetch order history');
      }
      const data = await response.json();
      
      // Set default values if data is undefined
      setOrderHistory(data.dailyOrders || []);
      setItemSales(data.itemSales || {});
      setTotalRevenue(data.dailyRevenue || 0);
      setMonthlyRevenue(data.monthlyRevenue || 0);
      setYearlyRevenue(data.yearlyRevenue || 0);
      setStatusCounts(data.statusCounts || {
        pending: 0,
        completed: 0,
        cancelled: 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const today = new Date();
    handleDateChange(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  // Helper function to safely get item price
  const getItemPrice = (item) => {
    return item && item.price ? item.price : 0;
  };

  // Helper function to safely get order total
  const getOrderTotal = (order) => {
    // Use the total from API response which already includes tax if available
    // Fallback to local calculation if for some reason total is not available
    return order?.total !== undefined 
      ? order.total 
      : (order?.items?.reduce((sum, item) => sum + (getItemPrice(item) * (item.quantity || 0)), 0) || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header className="" />
      
      {/* Professional Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm mt-18">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FaClipboardList className="text-xl text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Track daily sales and analyze business performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selection & Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Date Selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <FaCalendarAlt className="text-gray-500" />
                <span>Select Date:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Year Select */}
                <select
                  value={getYear(selectedDate)}
                  onChange={(e) => handleDateChange(Number(e.target.value), getMonth(selectedDate), getDate(selectedDate))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                {/* Month Select */}
                <select
                  value={getMonth(selectedDate)}
                  onChange={(e) => handleDateChange(getYear(selectedDate), Number(e.target.value), getDate(selectedDate))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  {months
                    .slice(0, getYear(selectedDate) === currentYear ? currentMonth + 1 : 12)
                    .map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                </select>

                {/* Date Select */}
                <select
                  value={getDate(selectedDate)}
                  onChange={(e) => handleDateChange(getYear(selectedDate), getMonth(selectedDate), Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  {Array.from({ length: getDaysInMonth(getYear(selectedDate), getMonth(selectedDate)) }, (_, index) =>
                    index + 1
                  ).filter(day => {
                    if (getYear(selectedDate) === currentYear && getMonth(selectedDate) === currentMonth) {
                      return day <= currentDate;
                    }
                    return true;
                  }).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <RefreshButton onRefresh={() => handleDateChange(
                getYear(selectedDate),
                getMonth(selectedDate),
                getDate(selectedDate)
              )} />
              <DownloadButton
                orders={orderHistory || []}
                itemSales={itemSales || {}}
                dailyRevenue={totalRevenue || 0}
                monthlyRevenue={monthlyRevenue || 0}
                yearlyRevenue={yearlyRevenue || 0}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading order history...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Status Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-100 rounded-md">
                  <HiOutlineChartBar className="text-lg text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Order Status Overview</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-600">Pending Orders</div>
                    <HiOutlineClock className="text-lg text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{statusCounts?.pending || 0}</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-green-700">Completed Orders</div>
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{statusCounts?.completed || 0}</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-red-700">Cancelled Orders</div>
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">×</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-700">{statusCounts?.cancelled || 0}</div>
                </div>
              </div>
            </div>

            {/* Item-wise Sales Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-100 rounded-md">
                  <HiOutlineChartBar className="text-lg text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Item-wise Sales Analysis</h2>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.keys(itemSales || {}).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <HiOutlineChartBar className="text-xl text-gray-400" />
                              </div>
                              <p className="text-gray-500 font-medium">No items sold on this date</p>
                              <p className="text-sm text-gray-400 mt-1">Sales data will appear here once orders are placed</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        Object.entries(itemSales || {}).map(([item, data], index) => (
                          <tr key={item} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{item}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {data?.quantity || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                              {formatCurrency(data?.revenue || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-100 rounded-md">
                  <FaRupeeSign className="text-lg text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Revenue Summary</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-600">Daily Revenue</div>
                    <HiOutlineCalendar className="text-lg text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">Today's earnings</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-blue-700">Monthly Revenue</div>
                    <FaCalendarAlt className="text-lg text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(monthlyRevenue || 0)}</div>
                  <div className="text-xs text-blue-600 mt-1">This month's total</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-green-700">Yearly Revenue</div>
                    <FaChartLine className="text-lg text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(yearlyRevenue || 0)}</div>
                  <div className="text-xs text-green-600 mt-1">Current year total</div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-100 rounded-md">
                  <HiOutlineClock className="text-lg text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Order Timeline</h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {orderHistory?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <HiOutlineClipboardList className="text-2xl text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No orders found</p>
                    <p className="text-sm text-gray-400 mt-1">Orders for the selected date will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory?.map((order, index) => (
                      <div key={order?._id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">
                                Order #{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime12Hour(order?.createdAt || new Date())}
                              </span>
                              {order?.tableNumber && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Table #{order.tableNumber}
                                </span>
                              )}
                            </div>
                            <StatusBadge status={order?.status || 'pending'} />
                          </div>
                        </div>
                        <div className="p-4">
                          {order?.items?.length ? (
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-900">{item?.name || 'Unknown'}</span>
                                    <span className="text-xs text-gray-500">×{item?.quantity || 0}</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{formatCurrency(getItemPrice(item))}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-900">Total</span>
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(getOrderTotal(order))}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500 text-sm">No items in this order</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
