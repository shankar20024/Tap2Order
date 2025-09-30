"use client";

import { useState } from "react";
import toast from 'react-hot-toast';

export default function useQuantity(apiStatus, orderPlaced) {
  const [itemQuantities, setItemQuantities] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});

  const incrementQuantity = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    
    setItemQuantities(qtys => {
      const current = qtys[itemId] || 0;
      return { ...qtys, [itemId]: current + 1 };
    });
  };

  const decrementQuantity = (itemId) => {
    if (!apiStatus) {
      toast.error('API is not available. Please try again later.');
      return;
    }
    if (orderPlaced) return;
    
    setItemQuantities(qtys => {
      const current = qtys[itemId] || 0;
      if (current <= 0) return qtys;
      return { ...qtys, [itemId]: current - 1 };
    });
  };

  const resetQuantity = (itemId) => {
    setItemQuantities(qtys => ({ ...qtys, [itemId]: 0 }));
  };

  const resetAllQuantities = () => {
    setItemQuantities({});
  };

  const handleSizeSelection = (itemId, sizeIndex) => {
    setSelectedSizes(prev => ({
      ...prev,
      [itemId]: sizeIndex
    }));
  };

  const getQuantity = (itemId) => {
    return itemQuantities[itemId] || 0;
  };

  const getSelectedSize = (itemId) => {
    return selectedSizes[itemId] || 0;
  };

  const getPriceForSize = (item, sizeIndex = 0) => {
    if (!item) return 0;
    
    // If item has pricing array (multiple sizes)
    if (item.pricing && Array.isArray(item.pricing) && item.pricing.length > 0) {
      const validIndex = Math.min(sizeIndex, item.pricing.length - 1);
      return item.pricing[validIndex]?.price || 0;
    }
    
    // Fallback to single price
    return item.price || 0;
  };

  return {
    itemQuantities,
    selectedSizes,
    incrementQuantity,
    decrementQuantity,
    resetQuantity,
    resetAllQuantities,
    handleSizeSelection,
    getQuantity,
    getSelectedSize,
    getPriceForSize
  };
}
