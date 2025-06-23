"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ably from "@/lib/ably";
import { FaUtensils, FaCheckCircle, FaClock, FaTimesCircle, FaBell, FaListAlt, FaClipboardList, FaHistory, FaTable, FaSync } from "react-icons/fa";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import AlertPing from "../components/AlertPing";
import Header from "@/app/components/Header";
import NavButton from "../components/NavButton";
import LogoutButton from "../components/Logout";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

function groupOrdersByTable(orders) {
  return orders.reduce((acc, order) => {
    if (!acc[order.tableNumber]) acc[order.tableNumber] = [];
    acc[order.tableNumber].push(order);
    return acc;
  }, {});
}

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOrderTables, setNewOrderTables] = useState([]);
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const channel = ably.channels.get("orders");

    // Subscribe to new orders
    channel.subscribe("new-order", (msg) => {
      const incomingOrder = msg.data;
      if (incomingOrder.cart && !incomingOrder.items) {
        incomingOrder.items = incomingOrder.cart; // Use 'items' for consistency
      }
      
      setOrders(prev => [...prev, incomingOrder]);
      setNewOrderTables(prev => [...new Set([...prev, incomingOrder.tableNumber])]);
      setHasNewOrder(true);
      
      toast.success(`New order from Table #${incomingOrder.tableNumber}`);
    });

    // Subscribe to order updates (completion or cancellation)
    channel.subscribe("order-updated", async (msg) => {
      const updatedOrder = msg.data;

      // Validate the order data
      if (!updatedOrder || !updatedOrder._id) {
        console.error("Invalid updated order data:", updatedOrder);
        return;
      }

      // Update local state with the new order status
      setOrders((prev) =>
        prev.map(order =>
          order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
        )
      );

      // If the order was completed or cancelled, remove it from the list
      if (updatedOrder.status === "completed" || updatedOrder.status === "cancelled") {
        setOrders(prev => prev.filter(order => order._id !== updatedOrder._id));
      }

      toast.success(`Order for Table #${updatedOrder.tableNumber} has been updated.`);
    });

    fetchOrders();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/order');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      // Filter out any completed orders that might have been fetched
      const activeOrders = data.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
      setOrders(activeOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error);
      setLoading(false);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      // Validate order ID
      if (!orderId || typeof orderId !== 'string') {
        toast.error("Invalid order ID");
        return;
      }

      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: "completed", paymentStatus: "paid" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete order");
      }

      const updatedOrder = await response.json();

      // Publish order update to Ably
      const channel = ably.channels.get("orders");
      await channel.publish("order-updated", {
        ...updatedOrder, // Send complete order data
        timestamp: Date.now()
      });

      
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error(error.message);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      // Validate order ID
      if (!orderId || typeof orderId !== 'string') {
        toast.error("Invalid order ID");
        return;
      }

      const response = await fetch(`/api/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: "cancelled" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }

      const updatedOrder = await response.json();

      // Publish order update to Ably
      const channel = ably.channels.get("orders");
      await channel.publish("order-updated", {
        ...updatedOrder, // Send complete order data
        timestamp: Date.now()
      });

      
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(error.message);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading state while checking auth or loading data
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <FaTimesCircle className="mx-auto text-red-500 text-4xl mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error.message || 'Failed to load dashboard data'}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <FaSync className="inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 md:py-24 py-28">
        <div className="flex flex-wrap gap-3  items-center md:justify-between justify-center  mb-10">
          <h1 className="text-4xl font-bold text-amber-800 flex items-center mb-6 md:mb-0 ">
            <FaUtensils className="mr-2" />
            Dashboard
          </h1>
          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-end">
            <NavButton href="/table" label="Manage Table" icon={<FaListAlt />} />
            <NavButton href="/menu" label="Manage Menu" icon={<FaClipboardList />} />
            <NavButton href="/order-history" label="Order History" icon={<FaHistory />} />
            <LogoutButton />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <h1 className="flex items-center gap-2 text-3xl sm:text-3xl font-bold text-amber-700">
            Live Orders
            <div className="ml-2">
              <AlertPing 
                isActive={hasNewOrder} 
                tableNumbers={newOrderTables}
                onClick={() => {
                  setHasNewOrder(false);
                  setNewOrderTables([]);
                }}
              />
            </div>
          </h1>
          <div className="flex gap-3">
            <span className="text-base bg-pink-100 text-pink-800 px-3 py-1 rounded-full whitespace-nowrap flex items-center">
              <FaClipboardList className="mr-1" />
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
            <span className="text-base bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap flex items-center">
              <FaTable className="mr-1" />
              {Object.keys(groupOrdersByTable(orders)).length} {Object.keys(groupOrdersByTable(orders)).length === 1 ? 'table' : 'tables'}
            </span>
          </div>
        </div>

        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <FaClipboardList className="mx-auto text-4xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Orders Yet</h3>
              <p className="text-gray-500 mt-1">New orders will appear here when placed</p>
            </div>
          ) : (
            Object.entries(groupOrdersByTable(orders)).map(([tableNumber, tableOrders]) => (
              <section key={tableNumber} className="bg-white bg-opacity-90 border border-amber-300 rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-amber-800 flex items-center">
                    <FaTable className="mr-2 text-amber-600" />
                    Table: {tableNumber}
                    <span className="ml-2 text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      {tableOrders.length} {tableOrders.length === 1 ? 'order' : 'orders'}
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-3 py-1 rounded-lg hover:from-amber-700 hover:to-amber-600 text-sm flex items-center"
                      onClick={() => tableOrders.forEach(order => completeOrder(order._id))}
                    >
                      <FaCheckCircle className="mr-1" />
                      <span className="hidden md:inline">Complete All</span>
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm flex items-center"
                      onClick={() => tableOrders.forEach(order => cancelOrder(order._id))}
                    >
                      <FaTimesCircle className="mr-1" />
                      <span className="hidden md:inline">Cancel All</span>
                    </button>
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-2">
                  {tableOrders.map((order) => {
                    const orderItems = order.items || order.cart || [];
                    const message = order.message || order.msg;

                    return (
                      <div key={order._id} className="bg-white border border-amber-200 shadow-lg rounded-xl p-4 min-w-[280px] flex-shrink-0">
                        {message && (
                          <div className="bg-yellow-100 p-3 rounded-lg mb-4 text-sm text-gray-800">
                            <strong className="block mb-1 text-amber-800">Special Instructions:</strong>
                            {message}
                          </div>
                        )}
                        <ul className="text-sm text-gray-800 mb-2">
                          {orderItems.length > 0 ? (
                            orderItems.map((item) => (
                              <li key={item.name}>
                                {item.name} × {item.quantity} - ₹{item.price}
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500 italic">No items in this order.</li>
                          )}
                        </ul>
                        <p className="font-semibold mt-2">Total: ₹
                          {order.totalAmount ||
                            orderItems.reduce((total, item) => total + item.price * item.quantity, 0)}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(order.createdAt || order.timestamp || Date.now()).toLocaleString()}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded-lg hover:from-green-700 hover:to-green-600 text-sm flex items-center"
                            onClick={() => completeOrder(order._id)}
                          >
                            <FaCheckCircle className="mr-1" />
                            Complete
                          </button>
                          <button
                            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-red-600 text-sm flex items-center"
                            onClick={() => cancelOrder(order._id)}
                          >
                            <FaTimesCircle className="mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );

}
