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

  return {
    itemQuantities,
    selectedSizes,
    incrementQuantity,
    decrementQuantity,
    resetQuantity,
    resetAllQuantities,
    handleSizeSelection,
    getQuantity,
    getSelectedSize
  };
}
