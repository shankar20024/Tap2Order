"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast from 'react-hot-toast';

export default function useCart(apiStatus, orderPlaced) {
  const [cart, setCart] = useState([]);
  const prevCartLengthRef = useRef(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart && !orderPlaced) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Error loading cart from localStorage:", err);
      }
    }
  }, [orderPlaced]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!orderPlaced) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, orderPlaced]);

  const addToCart = (item, quantity = 1, isUpdate = false) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    if (quantity <= 0) return;

    const isItemObject = typeof item === 'object';
    const itemId = isItemObject ? String(item._id || '') : String(item);

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(i => String(i.menuItemId) === itemId);

      if (existingIndex >= 0) {
        return prevCart.map((cartItem, idx) => {
          if (idx === existingIndex) {
            const newQuantity = isUpdate ? quantity : cartItem.quantity + quantity;
            return {
              ...cartItem,
              quantity: Math.max(1, newQuantity)
            };
          }
          return cartItem;
        });
      } else if (isItemObject) {
        return [...prevCart, {
          menuItemId: itemId,
          name: item.name,
          price: item.price,
          quantity: Math.max(1, quantity),
          notes: '',
          size: item.size
        }];
      }
      return prevCart;
    });
  };

  const decreaseQuantity = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    
    const existing = cart.find(i => i.menuItemId === itemId);
    if (!existing) return;
    
    if (existing.quantity === 1) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(i => 
        i.menuItemId === itemId 
          ? { ...i, quantity: i.quantity - 1 } 
          : i
      ));
    }
  };

  const removeFromCart = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    setCart(cart.filter((i) => i.menuItemId !== itemId));
  };

  const clearCart = () => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    setCart([]);
    localStorage.removeItem("cart");
  };

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const getTotalItemsCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const getItemSubtotal = useCallback((item) => {
    return (item.price * item.quantity).toFixed(2);
  }, []);

  // Reset cart when order is completed/cancelled
  const resetCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem("cart");
  }, []);

  return {
    cart,
    setCart,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItemsCount,
    getItemSubtotal,
    resetCart
  };
}
