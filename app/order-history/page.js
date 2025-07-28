"use client";
import { useState, useEffect } from "react";
import { format, getYear, getMonth, getDate, set } from "date-fns";
import RefreshButton from "../components/RefreshButton";
import DownloadButton from "../components/DownloadButton";
import { HiOutlineClipboardList } from "react-icons/hi";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[status]}`}
      style={{
        backgroundColor: status === 'pending' ? '#fff3cd' :
          status === 'completed' ? '#dcfce7' :
            '#fee2e2',
        color: status === 'pending' ? '#713f12' :
          status === 'completed' ? '#055129' :
            '#991b1b',
        borderColor: status === 'pending' ? '#fbbf24' :
          status === 'completed' ? '#10b981' :
            '#ef4444',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function OrderHistory() {
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
      const response = await fetch(`/api/order-history?date=${dateStr}`);
      if (!response.ok) {
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
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    handleDateChange(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  // Helper function to safely get item price
  const getItemPrice = (item) => {
    return item && item.price ? item.price : 0;
  };

  // Helper function to safely get order total
  const getOrderTotal = (order) => {
    return order && order.items && order.items.length > 0 
      ? order.items.reduce((sum, item) => sum + (getItemPrice(item) * (item.quantity || 0)), 0)
      : 0;
  };

  return (
    <div className="container mx-auto p-6 mt-20">
      <Header className="" />

      <h1 className="text-4xl font-bold text-amber-700 mb-6 flex items-center justify-center gap-2 md:hidden">
        <HiOutlineClipboardList className="text-amber-700" />
        Order History
      </h1>

      <div className="flex flex-col gap-4 md:flex-row md:gap-0 justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-amber-700 md:flex items-center justify-center gap-2 hidden">
            <HiOutlineClipboardList className="text-amber-700" />
            Order History
          </h1>
        </div>
        <div className="flex flex-row gap-4 items-center">
          {/* Year Select */}
          <select
            value={getYear(selectedDate)}
            onChange={(e) => handleDateChange(Number(e.target.value), getMonth(selectedDate), getDate(selectedDate))}
            className="rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 p-2"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Month Select */}
          <select
            value={getMonth(selectedDate)}
            onChange={(e) => handleDateChange(getYear(selectedDate), Number(e.target.value), getDate(selectedDate))}
            className="rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 p-2"
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
            className="rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 p-2"
          >
            
            {Array.from({ length: getDaysInMonth(getYear(selectedDate), getMonth(selectedDate)) }, (_, index) =>
              index + 1
            ).filter(day => {
              if (getYear(selectedDate) === currentYear && getMonth(selectedDate) === currentMonth) {
                return day <= currentDate;
              }
              return true;
            }).map(day => (
              <option  key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-4">
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[600px]">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Summary */}
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 w-full  mx-auto sm:scale-100 scale-[0.95] md:transform-none transform origin-top">
            <h2 className="text-3xl font-semibold text-amber-800 mb-4">Order Status</h2>
            <div className="flex flex-wrap sm:flex-nowrap gap-4">
              <div className="flex-1 bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{statusCounts?.pending || 0}</div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <div className="text-sm text-gray-500">Completed</div>
                <div className="text-2xl font-bold text-green-600">{statusCounts?.completed || 0}</div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <div className="text-sm text-gray-500">Cancelled</div>
                <div className="text-2xl font-bold text-red-600">{statusCounts?.cancelled || 0}</div>
              </div>
            </div>
          </div>

          {/* Item-wise Sales Table */}
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 h-[550px] overflow-y-scroll">
            <h2 className="text-3xl font-semibold text-amber-800 mb-4">Item-wise Sales</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Item</th>
                    <th className="py-2 px-4 text-left">Quantity</th>
                    <th className="py-2 px-4 text-left">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(itemSales || {}).length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-500">
                        No items sold on this date
                      </td>
                    </tr>
                  ) : (
                    Object.entries(itemSales || {}).map(([item, data]) => (
                      <tr key={item} className="border-b">
                        <td className="py-2 px-4">{item}</td>
                        <td className="py-2 px-4">{data?.quantity || 0}</td>
                        <td className="py-2 px-4">{formatCurrency(data?.revenue || 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Daily Revenue</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue || 0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Month Revenue</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyRevenue || 0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Current Year Revenue</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(yearlyRevenue || 0)}</p>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 overflow-y-scroll h-[600px]">
            <h2 className="text-3xl font-semibold text-amber-800 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {orderHistory?.length === 0 ? (
                <p className="text-gray-500">No orders found for the selected date.</p>
              ) : (
                orderHistory?.map((order, index) => (
                  <div key={order?._id || index} className="border rounded-lg overflow-hidden">
                    <div className="bg-amber-50 p-3 flex justify-between items-center border-b">
                      <div>
                        <span className="font-medium text-amber-900">
                          Order #{index + 1}
                        </span>
                        <span className="ml-3 md:text-sm text-xs text-gray-600">
                          ({formatTime12Hour(order?.createdAt || new Date())})
                        </span>
                        {order?.tableNumber && (
                          <span className="ml-3 text-sm text-blue-600">
                            Table #{order.tableNumber}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={order?.status || 'pending'} />
                    </div>
                    <div className="p-3">
                      {order?.items?.length ? (
                        order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-1">
                            <span>
                              {item?.name || 'Unknown'}
                              <span className="text-sm text-gray-500 ml-2">x{item?.quantity || 0}</span>
                            </span>
                            <span>{formatCurrency(getItemPrice(item))}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No items in this order</p>
                      )}
                      <div className="flex justify-between pt-2 mt-2 border-t font-medium">
                        <span>Total</span>
                        <span className="text-amber-700">
                          {formatCurrency(getOrderTotal(order))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
