"use client";

import { useState, useEffect, useCallback } from "react";
import ably from "@/lib/ably";
import toast from 'react-hot-toast';

export default function useOrder(userId, tableNumber, cart, getTotalPrice, resetCart, gstDetails = null) {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [prepTime, setPrepTime] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({});

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

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty, please add items before placing order.");
      return;
    }

    if (placingOrder) return;
    
    setPlacingOrder(true);
    setErrorMessage('');

    try {
      // Get client IP address
      let clientIP = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        clientIP = ipData.ip;
      } catch (ipError) {
        // IP fetch failed, continue without IP
      }

      // Create/update customer record first
      let customerId = null;
      
      if (customerInfo && customerInfo.name && customerInfo.phone) {
        try {
          const customerPayload = {
            name: customerInfo.name,
            phone: customerInfo.phone,
            userId,
            tableNumber,
            ip: clientIP
          };
          
          const customerResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerPayload),
          });

          if (customerResponse.ok) {
            const customerResult = await customerResponse.json();
            customerId = customerResult.customer._id;
          }
        } catch (customerError) {
          // Customer creation failed, continue without customer ID
        }
      }

      // Calculate total amount based on GST details
      const totalAmount = gstDetails && gstDetails.isGstApplicable ? gstDetails.grandTotal : getTotalPrice();

      // Place order with customer details and GST information
      const orderPayload = {
        tableNumber,
        cart: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || '',
          size: item.size || '',
          subcategory: item.subcategory || '',
          category: item.category || 'veg'
        })),
        userId,
        orderMessage,
        customerId,
        customerInfo: {
          name: customerInfo?.name || 'Guest',
          phone: customerInfo?.phone || '',
          ip: clientIP
        },
        totalAmount: totalAmount,
        gstDetails: gstDetails,
        orderType: 'dine-in'
      };

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (response.ok) {
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
        
        // Update customer stats if customer was created
        if (customerId && result.order) {
          try {
            await fetch(`/api/customers/${customerId}/update-stats`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                totalAmount: result.order.totalAmount
              }),
            });
          } catch (statsError) {
            // Stats update failed, continue
          }
        }
        
        // Publish to Ably channel for each order
        const channel = ably.channels.get(`orders/${userId}`);
        
        await channel.publish("new-order", {
          _id: result.order._id,
          tableNumber,
          items: result.order.items, // Use order.items which already includes subcategory
          totalAmount: result.order.totalAmount,
          message: orderMessage,
          createdAt: result.order.createdAt || new Date().toISOString(),
          timestamp: Date.now(),
          userId: userId,
          status: result.order.status || "pending",
          orderType: result.order.orderType || "food"
        });

        // Show success message
        toast.success(`Order #${result.order._id.slice(-4)} placed successfully!`);
        
        // Reset cart and order message after successful order
        resetCart();
        setOrderMessage('');
        
        // Reset order placed state to allow new orders
        setOrderPlaced(false);

        setPrepTime(15 + Math.floor(Math.random() * 15));
      } else {
        setErrorMessage(result.error || 'Failed to place order');
        toast.error(result.error || 'Failed to place order');
      }
    } catch (error) {
      const errorMsg = 'Network error. Please check your connection and try again.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setPlacingOrder(false);
    }
  }, [cart, customerInfo, placingOrder, resetCart, userId, tableNumber, orderMessage, gstDetails, getTotalPrice]);

  const resetOrderState = useCallback(() => {
    setOrderPlaced(false);
    setErrorMessage('');
  }, []);

  return {
    orderPlaced,
    placingOrder,
    errorMessage,
    orderMessage,
    setOrderMessage,
    prepTime,
    placeOrder,
    customerInfo,
    setCustomerInfo,
    resetOrderState
  };
}
