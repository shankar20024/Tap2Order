"use client";
import { useEffect, useState } from "react";
import ably from "@/lib/ably";
import NavButton from "../components/NavButton";
import LogoutButton from "../components/Logout";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const channel = ably.channels.get("orders");

    // Subscribe to new orders
    channel.subscribe("new-order", (msg) => {
      const incomingOrder = msg.data;
      if (incomingOrder.cart && !incomingOrder.items) {
        incomingOrder.items = incomingOrder.cart; // Use 'items' for consistency
      }
      setOrders((prev) => [...prev, incomingOrder]);
      
      
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
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders.");
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
        body: JSON.stringify({ status: "completed",paymentStatus: "paid" })
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

      toast.success(`Order #${updatedOrder._id} completed successfully`);
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

      toast.success(`Order #${updatedOrder._id} cancelled successfully`);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <NavButton href="/table" label="Manage table" />
        <NavButton href="/menu" label="Manage Menu" />
        <NavButton href="/order-history" label="Order History" />
        <LogoutButton />
      </div>

      <h1 className="text-xl font-bold mb-4">Live Orders</h1>

      {orders.length === 0 ? (
        <p>No orders yet...</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const orderItems = order.items || order.cart || [];
            const message = order.message || order.msg; // Check both fields
            return (
              <div key={order._id} className="border p-4 rounded-lg shadow">
                <h2 className="font-semibold">Table: {order.tableNumber}</h2>
                
                {message && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Special Instructions</span>
                    </div>
                    <p className="text-sm text-gray-700">{message}</p>
                  </div>
                )}

                <ul className="text-sm mt-2">
                  {orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <li key={item.name}> {/* Assuming name is unique */}
                        {item.name} x {item.quantity} - ₹{item.price}
                      </li>
                    ))
                  ) : (
                    <li>No items in this order.</li>
                  )}
                </ul>
                <p className="mt-2 font-bold">Total: ₹{order.totalAmount || order.items.reduce((total, item) => total + (item.price * item.quantity), 0)}</p>
                <div className="flex space-x-2 mt-4">
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => completeOrder(order._id)}
                  >
                    ✔ Complete
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => cancelOrder(order._id)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
