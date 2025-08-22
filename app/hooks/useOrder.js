"use client";

import { useState, useEffect } from "react";
import ably from "@/lib/ably";
import toast from 'react-hot-toast';

export default function useOrder(userId, tableNumber, cart, getTotalPrice, resetCart) {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [prepTime, setPrepTime] = useState(null);

  // Real-time order updates
  useEffect(() => {
    if (!userId || !tableNumber) return;

    const channel = ably.channels.get(`orders:${userId}`);

    const handleOrderUpdate = async (msg) => {
      const updatedOrder = msg.data;

      if (updatedOrder && updatedOrder.tableNumber === tableNumber) {
        resetCart();
        setOrderPlaced(false);
        setOrderMessage('');

        if (updatedOrder.status === "completed") {
          toast.success("Order completed. Ready for the next customer.");
        } else if (updatedOrder.status === "cancelled") {
          toast.success("Order cancelled. Ready for the next customer.");
        }
      }
    };

    // Initial cleanup for table
    handleOrderUpdate({ data: { tableNumber } });

    channel.subscribe("order-updated", handleOrderUpdate);

    return () => {
      channel.unsubscribe("order-updated", handleOrderUpdate);
    };
  }, [userId, tableNumber, resetCart]);

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty, please add items before placing order.");
      return;
    }

    setErrorMessage('');
    setPlacingOrder(true);

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          cart: cart.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || '',
            size: item.size || '',
            subcategory: item.subcategory || ''
          })),
          userId,
          orderMessage
        }),
      });

      if (!res.ok) throw new Error("Order failed");

      const orderData = await res.json();

      // Handle both single order and array of orders (for separated beverages/food orders)
      const orders = Array.isArray(orderData) ? orderData : [orderData];
      const firstOrder = orders[0];

      // Publish to Ably channel for each order
      const channel = ably.channels.get(`orders:${userId}`);
      
      for (const order of orders) {
        await channel.publish("new-order", {
          _id: order._id,
          tableNumber,
          items: order.items, // Use order.items which already includes subcategory
          totalAmount: order.totalAmount,
          message: orderMessage,
          createdAt: order.createdAt || new Date().toISOString(),
          timestamp: Date.now(),
          userId: userId,
          status: order.status || "pending",
          orderType: order.orderType || "food"
        });
      }

      // Show success message
      if (orders.length === 1) {
        toast.success(`Order #${firstOrder._id.slice(-4)} placed successfully!`);
      } else {
        toast.success(`${orders.length} orders placed successfully! (Beverages & Food separated)`);
      }
      
      // Reset cart and order message after successful order
      resetCart();
      setOrderMessage('');
      
      // Reset order placed state to allow new orders
      setOrderPlaced(false);

      setPrepTime(15 + Math.floor(Math.random() * 15));
    } catch (err) {
      setErrorMessage('Failed to place order. Please try again.');
      console.error(err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return {
    orderPlaced,
    placingOrder,
    errorMessage,
    orderMessage,
    setOrderMessage,
    prepTime,
    placeOrder
  };
}
