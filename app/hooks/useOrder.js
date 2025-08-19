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
      // Debug logging
      console.log('[QR Menu] Cart data before sending to API:', cart);
      cart.forEach((item, index) => {
        console.log(`[QR Menu] Cart item ${index}:`, {
          name: item.name,
          size: item.size,
          price: item.price,
          quantity: item.quantity
        });
      });

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
            size: item.size || ''
          })),
          userId,
          orderMessage
        }),
      });

      if (!res.ok) throw new Error("Order failed");

      const orderData = await res.json();

      // Publish to Ably channel
      const channel = ably.channels.get(`orders:${userId}`);
      await channel.publish("new-order", {
        _id: orderData._id,
        tableNumber,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size || ''
        })),
        totalAmount: getTotalPrice(),
        message: orderMessage,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        userId: userId,
        status: "pending"
      });

      toast.success(`Order placed successfully`);
      setOrderPlaced(true);
      
      // Clear cart immediately after successful order placement
      resetCart();

      // Subscribe to order updates for this specific order
      channel.subscribe("order-updated", async (msg) => {
        const updatedOrder = msg.data;
        if (updatedOrder._id === orderData._id) {
          if (updatedOrder.status === "completed" || updatedOrder.status === "cancelled") {
            setOrderPlaced(false);
            setOrderMessage('');
            toast.success(`Order #${updatedOrder._id} has been ${updatedOrder.status === "completed" ? "completed" : "cancelled"}. You can place a new order.`);
          }
        }
      });

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
